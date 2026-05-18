import type { Config } from "../config.js";

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

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
  private config: Config["strava"];

  constructor(config: Config["strava"]) {
    this.config = config;
  }

  private async getAccessToken(): Promise<string> {
    const { accessToken, refreshToken, expiresAt, clientId, clientSecret } = this.config;

    if (accessToken && expiresAt && expiresAt > Date.now() / 1000 + 60) {
      return accessToken;
    }

    if (!refreshToken) {
      throw new Error("No Strava refresh token available. Please run setup.");
    }

    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to refresh Strava token: ${error}`);
    }

    const data = (await res.json()) as StravaTokenResponse;
    this.config.accessToken = data.access_token;
    this.config.refreshToken = data.refresh_token;
    this.config.expiresAt = data.expires_at;

    return data.access_token;
  }

  private async request<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    const token = await this.getAccessToken();
    const url = new URL(`https://www.strava.com/api/v3${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, String(v)));

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Strava API error (${path}): ${error}`);
    }

    return (await res.json()) as T;
  }

  async getAthlete(): Promise<StravaAthlete> {
    return this.request<StravaAthlete>("/athlete");
  }

  async listActivities(params: { before?: number; after?: number; page?: number; per_page?: number } = {}): Promise<StravaActivity[]> {
    return this.request<StravaActivity[]>("/athlete/activities", params);
  }

  async getActivity(id: number): Promise<StravaActivity> {
    return this.request<StravaActivity>(`/activities/${id}`);
  }

  async getActivityStreams(
    id: number,
    keys: string[] = ["time", "distance", "watts", "heartrate", "cadence", "speed", "altitude"],
  ): Promise<Record<string, number[]>> {
    const raw = await this.request<unknown>(
      `/activities/${id}/streams`,
      { keys: keys.join(","), key_by_type: 1 },
    );
    const result: Record<string, number[]> = {};
    if (Array.isArray(raw)) {
      for (const s of raw as Array<{ type: string; data: number[] }>) {
        result[s.type] = s.data;
      }
    } else if (typeof raw === "object" && raw !== null) {
      for (const [key, val] of Object.entries(raw)) {
        if (val && typeof val === "object" && "data" in val) {
          result[key] = (val as { data: number[] }).data;
        }
      }
    }
    return result;
  }
}
