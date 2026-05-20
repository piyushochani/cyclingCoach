import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { CONFIG_FILE } from "../config.js";

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date_local: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  total_elevation_gain?: number;
  average_watts?: number;
  max_watts?: number;
  weighted_average_watts?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  average_speed?: number;
  max_speed?: number;
  kilojoules?: number;
  description?: string | null;
  laps?: StravaLap[];
}

export interface StravaLap {
  id: number;
  name: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  average_watts?: number;
  average_heartrate?: number;
  average_cadence?: number;
}

export interface StravaAthlete {
  id: number;
  username?: string;
  firstname: string;
  lastname: string;
  weight?: number;
  sex?: string;
  ftp?: number;
}

export interface AthleteProfile {
  ftp?: number;
  weight?: number;
  height?: number;
  maxHeartRate?: number;
  restingHeartRate?: number;
  yearsInCycling?: number;
  preferredDisciplines?: string[];
  firstname?: string;
  lastname?: string;
}

export interface Streams {
  watts?: number[];
  heartrate?: number[];
  cadence?: number[];
  speed?: number[];
  altitude?: number[];
  time?: number[];
  distance?: number[];
}

export class StravaClient {
  private accessToken: string;
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private expiresAt: number;
  private refreshPromise: Promise<void> | null = null;

  constructor(config: string | {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    clientId: string;
    clientSecret: string;
  }) {
    if (typeof config === "string") {
      this.accessToken = config;
      this.clientId = "";
      this.clientSecret = "";
      this.refreshToken = "";
      this.expiresAt = 0;
    } else {
      this.accessToken = config.accessToken ?? "";
      this.clientId = config.clientId;
      this.clientSecret = config.clientSecret;
      this.refreshToken = config.refreshToken ?? "";
      this.expiresAt = config.expiresAt ?? 0;
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.clientId || !this.clientSecret || !this.refreshToken) {
      throw new Error("Strava token refresh unavailable: missing clientId, clientSecret, or refreshToken");
    }

    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "refresh_token",
        refresh_token: this.refreshToken,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Strava token refresh failed: ${body}`);
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };

    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.expiresAt = data.expires_at;

    this.persistTokens();
  }

  private persistTokens(): void {
    try {
      if (existsSync(CONFIG_FILE)) {
        let content = readFileSync(CONFIG_FILE, "utf-8");

        const indent = this.detectIndent(content, "strava");

        const fields: Array<{ key: string; val: string | number }> = [
          { key: "access_token", val: this.accessToken },
          { key: "refresh_token", val: this.refreshToken },
          { key: "expires_at", val: this.expiresAt },
        ];

        for (const { key, val } of fields) {
          const lineRegex = new RegExp(`^(\\s*)(${key}:\\s*).*$`, "m");
          const match = lineRegex.exec(content);
          if (match) {
            content = content.replace(lineRegex, `$1$2${val}`);
          } else {
            content = content.replace(/^(\s*strava:.*)$/m, `$1\n${indent}${key}: ${val}`);
          }
        }

        writeFileSync(CONFIG_FILE, content, "utf-8");
      }
    } catch {
      // Best-effort persistence — failure is non-fatal
    }
  }

  private detectIndent(content: string, section: string): string {
    const sectionMatch = new RegExp(`^\\s*${section}:`, "m").exec(content);
    if (sectionMatch) {
      const base = sectionMatch[0].length - section.length - 1;
      const baseStr = " ".repeat(base);
      const lineMatch = new RegExp(`^${baseStr}\\s+\\w+:`, "m").exec(content);
      if (lineMatch) {
        const total = lineMatch[0].search(/\S/);
        return " ".repeat(total);
      }
      return baseStr + "  ";
    }
    return "  ";
  }

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`https://www.strava.com/api/v3${path}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (res.status === 401 && this.refreshToken) {
      if (!this.refreshPromise) {
        this.refreshPromise = this.refreshAccessToken().finally(() => {
          this.refreshPromise = null;
        });
      }
      await this.refreshPromise;

      const retryRes = await fetch(`https://www.strava.com/api/v3${path}`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      if (!retryRes.ok) {
        const error = await retryRes.text();
        throw new Error(`Strava API error (${path}): ${error}`);
      }
      return (await retryRes.json()) as T;
    }

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Strava API error (${path}): ${error}`);
    }
    return (await res.json()) as T;
  }

  async getAthlete(): Promise<StravaAthlete> {
    return this.request<StravaAthlete>("/athlete");
  }

  async getActivity(id: number): Promise<StravaActivity> {
    return this.request<StravaActivity>(`/activities/${id}`);
  }

  async listActivities(params: { after?: number; before?: number; page?: number; per_page?: number } = {}): Promise<StravaActivity[]> {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    return this.request<StravaActivity[]>(`/athlete/activities${qs ? `?${qs}` : ""}`);
  }

  async getActivityStreams(
    id: number,
    keys: string[] = ["time", "distance", "watts", "heartrate", "cadence", "speed", "altitude"],
  ): Promise<Record<string, number[]>> {
    const qs = `keys=${keys.join(",")}&key_by_type=true`;
    const raw: unknown = await this.request(`/activities/${id}/streams?${qs}`);
    const out: Record<string, number[]> = {};
    if (Array.isArray(raw)) {
      for (const s of raw as Array<{ type: string; data: number[] }>) {
        out[s.type] = s.data;
      }
    } else {
      for (const s of Object.values(raw as Record<string, { type: string; data: number[] }>)) {
        out[s.type] = s.data;
      }
    }
    return out;
  }
}
