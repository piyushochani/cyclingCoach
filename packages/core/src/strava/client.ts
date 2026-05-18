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

  constructor(token: string) {
    this.accessToken = token;
  }

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`https://www.strava.com/api/v3${path}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
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
