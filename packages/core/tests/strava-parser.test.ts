import { describe, it, expect } from "vitest";
import { parseStravaActivity } from "../src/embeddings/analysis-parser.ts";
import type { StravaActivity, AthleteProfile, Streams } from "../src/strava/client.js";

function makeMorningRide(): {
  activity: StravaActivity;
  streams: Streams;
  profile: AthleteProfile;
} {
  const activity: StravaActivity = {
    id: 42_987_654,
    name: "Morning Ride",
    type: "Ride",
    sport_type: "Ride",
    start_date_local: "2026-05-18T06:30:00",
    elapsed_time: 5400,
    moving_time: 5100,
    distance: 65_000,
    total_elevation_gain: 340,
    average_watts: 185,
    weighted_average_watts: 192,
    kilojoules: 943,
    average_heartrate: 142,
    max_heartrate: 168,
    average_cadence: 87,
    average_speed: 12.5,
    max_speed: 18.3,
  };

  // Simulate 5100 seconds (85 min) of 1 Hz data. Start with 20 s of zero
  // power (coast-starts), then hold a steady 185 W. Every ~1000 s inject a
  // genuine spike or a dropout so we can verify detection.
  const watts: number[] = [];
  const heartrate: number[] = [];
  for (let s = 0; s < 5100; s++) {
    // First 20 s — coasting / sensor lag (zero power, but HR still valid)
    if (s < 20) { watts.push(0); heartrate.push(142); continue; }

    // Inject a dropout every ~1000 s (sensor loses signal briefly)
    if (s % 1000 === 0 && s > 0) {
      watts.push(0);
      heartrate.push(0);
      continue;
    }

    // Inject an unrealistic spike at s=2500 (simulate electrical noise)
    if (s === 2500) {
      watts.push(3500); // way above 2000 W ceiling and >3x 185
      heartrate.push(142);
      continue;
    }

    // Normal data — keep noise within zone 2 (< 0.75 * 250 = 187.5)
    const baseW = 180;
    const baseHr = 142;
    // Noise of ±3 W keeps power firmly in zone 2 (range 177–183 → frac 0.708–0.732)
    watts.push(baseW + (Math.random() > 0.5 ? 1 : -1) * Math.round(Math.random() * 3));
    heartrate.push(baseHr + (Math.random() > 0.5 ? 1 : -1) * Math.round(Math.random() * 4));
  }

  const profile: AthleteProfile = {
    ftp: 250,
    weight: 72,
  };

  return {
    activity,
    streams: { watts, heartrate, cadence: [], speed: [], altitude: [], time: [], distance: [] },
    profile,
  };
}

function makeNoPowerActivity(): {
  activity: StravaActivity;
  streams: Streams;
  profile: AthleteProfile;
} {
  const activity: StravaActivity = {
    id: 12_345,
    name: "Easy Spin",
    type: "Ride",
    sport_type: "Ride",
    start_date_local: "2026-05-17T12:00:00",
    elapsed_time: 3600,
    moving_time: 3500,
    distance: 40_000,
    total_elevation_gain: 50,
    kilojoules: 0,
    average_heartrate: 128,
    max_heartrate: 144,
  };

  // HR only — no power stream
  const heartrate: number[] = [];
  for (let s = 0; s < 3500; s++) {
    heartrate.push(128 + Math.round(Math.sin(s / 200) * 8));
  }

  return {
    activity,
    streams: { heartrate },
    profile: { ftp: 250, weight: 72 },
  };
}

// ══════════════════════════════════════════════════════════════════════════
// Tests
// ══════════════════════════════════════════════════════════════════════════

describe("parseStravaActivity", () => {
  it("parses core metrics from a typical morning ride", () => {
    const { activity, streams, profile } = makeMorningRide();
    const result = parseStravaActivity(activity, streams, profile);

    expect(result.id).toBe(42_987_654);
    expect(result.name).toBe("Morning Ride");
    expect(result.sportType).toBe("Ride");
    expect(result.startDateLocal).toBe("2026-05-18T06:30:00");

    expect(result.distance).toBe(65_000);
    expect(result.movingTime).toBe(5100);
    expect(result.elapsedTime).toBe(5400);
    expect(result.totalElevationGain).toBe(340);

    // avgSpeedKmh = 65000 / 5100 * 3.6 ≈ 45.88
    expect(result.avgSpeedKmh).toBeCloseTo(45.88, 1);

    expect(result.avgPower).toBe(185);
    // kJ = 943 as provided in mock activity
    expect(result.kJ).toBe(943);
  });

  it("computes zone time correctly", () => {
    const { activity, streams, profile } = makeMorningRide();
    const result = parseStravaActivity(activity, streams, profile);

    // With FTP = 250, 180 W → frac = 0.72, which is zone 2 (0.55–0.75).
    // Non-dropout seconds = 5100 - 25 = 5075 (20 coast + 5 periodic).
    const nonDropout = 5075;
    expect(result.z1_seconds).toBe(0);
    expect(result.z2_seconds).toBeGreaterThanOrEqual(nonDropout - 10);
    expect(result.z3_seconds).toBe(0);
    expect(result.z4_seconds).toBe(0);
    expect(result.z5_seconds).toBe(0);
    expect(result.z6_seconds).toBe(0);
    expect(result.z7_seconds).toBe(1); // the injected 3500 W spike at s=2500
  });

  it("detects power and HR dropouts", () => {
    const { activity, streams, profile } = makeMorningRide();
    const result = parseStravaActivity(activity, streams, profile);

    // Power: 20 zero-watt coast (s<20) + 5 periodic zeroes (s=1000,2000,…)
    expect(result.powerDropoutSeconds).toBe(25);
    // HR: only the 5 periodic zeroes (coast period has valid HR)
    expect(result.hrDropoutSeconds).toBe(5);
  });

  it("detects unrealistic power spikes", () => {
    const { activity, streams, profile } = makeMorningRide();
    const result = parseStravaActivity(activity, streams, profile);

    // One spike at s=2500: 3500 W > 2000 ceiling AND > 555 (3 × 185)
    expect(result.unrealisticSpikes).toBe(1);
  });

  it("flags power and HR data presence correctly", () => {
    const { activity, streams, profile } = makeMorningRide();
    const result = parseStravaActivity(activity, streams, profile);

    expect(result.hasPowerData).toBe(true);
    expect(result.hasHrData).toBe(true);
  });

  it("handles a ride with no power data", () => {
    const { activity, streams, profile } = makeNoPowerActivity();
    const result = parseStravaActivity(activity, streams, profile);

    expect(result.hasPowerData).toBe(false);
    expect(result.hasHrData).toBe(true);
    expect(result.avgPower).toBeNull();
    expect(result.kJ).toBe(0);
    expect(result.powerDropoutSeconds).toBe(0);
    expect(result.unrealisticSpikes).toBe(0);

    // All zone times should be 0
    expect(result.z1_seconds).toBe(0);
    expect(result.z2_seconds).toBe(0);
    expect(result.z3_seconds).toBe(0);
    expect(result.z4_seconds).toBe(0);
    expect(result.z5_seconds).toBe(0);
    expect(result.z6_seconds).toBe(0);
    expect(result.z7_seconds).toBe(0);
  });

  it("uses default FTP in the absence of a profile FTP", () => {
    const { activity, streams } = makeMorningRide();
    const profileNoFtp: AthleteProfile = { weight: 72 };
    const result = parseStravaActivity(activity, streams, profileNoFtp);

    // Default FTP = 250 → frac = 185 / 250 = 0.74 (zone 2)
    expect(result.z2_seconds).toBeGreaterThan(0);
    expect(result.avgPower).toBe(185);
  });

  it("returns Endurance sessionType and outdoor hardTags", () => {
    const { activity, streams, profile } = makeMorningRide();
    const result = parseStravaActivity(activity, streams, profile);

    expect(result.sessionType).toBe("Endurance");
    expect(result.hardTags).toContain("endurance");
    expect(result.hardTags).toContain("outdoor");
    expect(result.hardTags).toContain("rolling");
    expect(result.hardTags).toContain("steady-pacing");
    expect(result.hardTags).toContain("fast");
  });

  it("is deterministic — repeated calls produce identical output", () => {
    const { activity, streams, profile } = makeMorningRide();
    const a = parseStravaActivity(activity, streams, profile);
    const b = parseStravaActivity(activity, streams, profile);

    expect(b).toEqual(a);
  });
});
