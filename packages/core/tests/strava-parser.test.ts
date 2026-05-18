import { describe, it, expect } from "vitest";
import { parseStravaActivity, assessDataQuality, computeTimeInZones } from "../src/embeddings/analysis-parser.js";
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

  // 5100 seconds of 1 Hz data. First 20 s coasting (watts=0, HR valid),
  // then steady ~180 W. Every ~1000 s inject a dropout (both signals).
  // One unrealistic spike at s=2500.
  const watts: number[] = [];
  const heartrate: number[] = [];
  for (let s = 0; s < 5100; s++) {
    if (s < 20) { watts.push(0); heartrate.push(142); continue; }

    if (s % 1000 === 0 && s > 0) {
      watts.push(0);
      heartrate.push(0);
      continue;
    }

    if (s === 2500) {
      watts.push(3500);
      heartrate.push(142);
      continue;
    }

    const baseW = 180;
    const baseHr = 142;
    watts.push(baseW + (Math.random() > 0.5 ? 1 : -1) * Math.round(Math.random() * 3));
    heartrate.push(baseHr + (Math.random() > 0.5 ? 1 : -1) * Math.round(Math.random() * 4));
  }

  return {
    activity,
    streams: { watts, heartrate, cadence: [], speed: [], altitude: [], time: [], distance: [] },
    profile: { ftp: 250, weight: 72 },
  };
}

function makeNoPowerActivity(): {
  activity: StravaActivity;
  streams: Streams;
  profile: AthleteProfile;
} {
  const heartrate: number[] = [];
  for (let s = 0; s < 3500; s++) {
    heartrate.push(128 + Math.round(Math.sin(s / 200) * 8));
  }

  return {
    activity: {
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
    },
    streams: { heartrate },
    profile: { ftp: 250, weight: 72 },
  };
}

// ══════════════════════════════════════════════════════════════════════════

describe("parseStravaActivity", () => {
  it("parses core metrics from a typical morning ride", () => {
    const { activity, streams, profile } = makeMorningRide();
    const result = parseStravaActivity(activity, streams, profile);

    expect(result.id).toBe(42_987_654);
    expect(result.name).toBe("Morning Ride");
    expect(result.sportType).toBe("Ride");
    expect(result.startDate).toBe("2026-05-18T06:30:00");

    expect(result.distance).toBe(65_000);
    expect(result.movingTime).toBe(5100);
    expect(result.elapsedTime).toBe(5400);
    expect(result.elevationGain).toBe(340);

    // avgSpeedKmh = 65000 / 5100 * 3.6 ≈ 45.88
    expect(result.avgSpeedKmh).toBeCloseTo(45.88, 1);

    expect(result.avgPower).toBe(185);
    expect(result.kJ).toBe(943);
  });

  it("computes zone time correctly", () => {
    const { activity, streams, profile } = makeMorningRide();
    const result = parseStravaActivity(activity, streams, profile);
    const zones = result.powerZoneSeconds;

    // FTP=250, ~180 W → frac = 0.72, firmly in zone 2 (0.55-0.75)
    expect(zones.z1).toBe(0);
    // Non-dropout seconds = 5075 (5100 - 25), nearly all zone 2
    expect(zones.z2).toBeGreaterThanOrEqual(5050);
    expect(zones.z3).toBe(0);
    expect(zones.z4).toBe(0);
    expect(zones.z5).toBe(0);
    expect(zones.z6).toBe(0);
    // The 3500 W spike → z7 (frac = 14)
    expect(zones.z7).toBe(1);
  });

  it("detects power and HR dropouts", () => {
    const { activity, streams, profile } = makeMorningRide();
    const result = parseStravaActivity(activity, streams, profile);
    const dq = result.dataQuality;

    // Power dropouts: transitions from >0 to 0
    // s=20 (first after coast): 0→0 is not a transition; s=1000,2000,3000,4000,5000 are
    // But test fixture: s=19→20: watts[19]=0, watts[20]=142 (hr). watts[19]=0, watts[20]=180 → no transition
    // Actually the transition detection is: powerStream[i]===0 && powerStream[i-1]>0
    // Coast: s=0-19 are all 0. s=20 is baseW=180. That's a transition at i=20 (powerStream[20]>0, powerStream[19]=0) — NOT a dropout.
    // s=1000: powerStream[999] is baseW (>0), powerStream[1000]=0 → dropout
    // So dropouts at s=1000,2000,3000,4000,5000 = 5 transitions
    // But also coast-start: s=0-19 all zero: no transitions within that block.
    // Total power dropouts ≈ 5
    expect(dq.powerDropoutSeconds).toBe(5);

    // HR dropouts: same transitions at s=1000,2000,3000,4000,5000 = 5
    expect(dq.hrDropoutSeconds).toBe(5);
  });

  it("detects unrealistic power spikes", () => {
    const { activity, streams, profile } = makeMorningRide();
    const result = parseStravaActivity(activity, streams, profile);

    // assessDataQuality check: powerStream[i] > powerStream[i-1] * 3 && > 1500
    // At s=2500: power=3500, prev=180. 3500 > 180*3 (540) AND > 1500 → spike
    expect(result.dataQuality.unrealisticSpikes).toBe(1);
  });

  it("flags power and HR data presence correctly", () => {
    const { activity, streams, profile } = makeMorningRide();
    const result = parseStravaActivity(activity, streams, profile);

    expect(result.dataQuality.hasPowerData).toBe(true);
    expect(result.dataQuality.hasHrData).toBe(true);
    expect(result.dataQuality.missingCadence).toBe(true);
    expect(result.dataQuality.missingSpeed).toBe(true);
  });

  it("handles a ride with no power data", () => {
    const { activity, streams, profile } = makeNoPowerActivity();
    const result = parseStravaActivity(activity, streams, profile);

    expect(result.dataQuality.hasPowerData).toBe(false);
    expect(result.dataQuality.hasHrData).toBe(true);
    expect(result.avgPower).toBeUndefined();
    expect(result.np).toBeUndefined();
    expect(result.tss).toBeUndefined();

    const zones = result.powerZoneSeconds;
    expect(zones.z1).toBe(0);
    expect(zones.z2).toBe(0);
    expect(zones.z3).toBe(0);
    expect(zones.z4).toBe(0);
    expect(zones.z5).toBe(0);
    expect(zones.z6).toBe(0);
    expect(zones.z7).toBe(0);
  });

  it("surfaces sessionType and hardTags", () => {
    const { activity, streams, profile } = makeMorningRide();
    const result = parseStravaActivity(activity, streams, profile);

    // 340 m gain / 65 km = 5.23 m/km → "rolling"
    expect(result.sessionType).toBe("Endurance");
    expect(result.hardTags).toContain("outdoor");
    expect(result.hardTags).toContain("rolling");
  });

  it("is deterministic — repeated calls produce identical output", () => {
    const { activity, streams, profile } = makeMorningRide();
    const a = parseStravaActivity(activity, streams, profile);
    const b = parseStravaActivity(activity, streams, profile);

    expect(b).toEqual(a);
  });
});

describe("assessDataQuality", () => {
  it("counts power dropout transitions", () => {
    const pw = [180, 185, 0, 0, 190, 0, 200];
    const dq = assessDataQuality(pw, [140, 142, 0, 0, 145, 0, 148], [], []);
    // Power dropouts at idx 2 and 5 (previous > 0)
    expect(dq.powerDropoutSeconds).toBe(2);
    // HR dropouts at idx 2 and 5
    expect(dq.hrDropoutSeconds).toBe(2);
  });

  it("flags missing cadence and speed", () => {
    const dq = assessDataQuality([100], [100], undefined, []);
    expect(dq.missingCadence).toBe(true);
    expect(dq.missingSpeed).toBe(true);

    const dq2 = assessDataQuality([100], [100], [90], [8]);
    expect(dq2.missingCadence).toBe(false);
    expect(dq2.missingSpeed).toBe(false);
  });
});

describe("computeTimeInZones", () => {
  it("classifies correctly using standard Coggan thresholds", () => {
    // FTP = 250 W
    // Z1: ≤ 137.5, Z2: ≤ 187.5, Z3: ≤ 217.5, Z4: ≤ 250,
    // Z5: ≤ 300, Z6: ≤ 375, Z7: > 375
    const stream = [100, 150, 200, 230, 260, 320, 400, 0, -1];
    const zones = computeTimeInZones(stream, 250);
    expect(zones.z1).toBe(1); // 100
    expect(zones.z2).toBe(1); // 150
    expect(zones.z3).toBe(1); // 200
    expect(zones.z4).toBe(1); // 230
    expect(zones.z5).toBe(1); // 260
    expect(zones.z6).toBe(1); // 320
    expect(zones.z7).toBe(1); // 400
  });

  it("returns all zeros for empty stream", () => {
    const zones = computeTimeInZones([], 250);
    expect(zones.z1).toBe(0);
    expect(zones.z2).toBe(0);
    expect(zones.z3).toBe(0);
    expect(zones.z4).toBe(0);
    expect(zones.z5).toBe(0);
    expect(zones.z6).toBe(0);
    expect(zones.z7).toBe(0);
  });
});
