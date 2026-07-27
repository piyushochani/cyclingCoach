import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { User } from '../user/user.schema';

const STRAVA_API = 'https://www.strava.com/api/v3';

export interface StravaAppCredentials {
  clientId: string;
  clientSecret: string;
}

export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId?: number;
}

@Injectable()
export class StravaTokenService {
  private readonly logger = new Logger(StravaTokenService.name);
  private credentials: StravaAppCredentials | null = null;

  private configPaths = [
    join(homedir(), '.cycling-coach', 'config.yaml'),
    join(homedir(), '.config', 'cycling-coach', 'config.yaml'),
    join(homedir(), '.enduragent', 'cycling-coach', 'config.yaml'),
  ];

  constructor(@InjectModel(User.name) private userModel: Model<User>) {
    this.credentials = this.readAppCredentials();
  }

  getRedirectUri(): string {
    if (process.env.STRAVA_REDIRECT_URI) return process.env.STRAVA_REDIRECT_URI;
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return `${process.env.NEXT_PUBLIC_APP_URL}/auth/strava/callback`;
    }
    return 'http://localhost:3000/auth/strava/callback';
  }

  readAppCredentials(): StravaAppCredentials | null {
    const envClientId = process.env.STRAVA_CLIENT_ID || '';
    const envClientSecret = process.env.STRAVA_CLIENT_SECRET || '';
    if (envClientId && envClientSecret) {
      return { clientId: envClientId, clientSecret: envClientSecret };
    }

    for (const filePath of this.configPaths) {
      if (!existsSync(filePath)) continue;
      try {
        const raw = readFileSync(filePath, 'utf-8');
        const config = parseYaml(raw) as any;
        const strava = config?.strava;
        if (strava?.client_id && strava?.client_secret) {
          return { clientId: String(strava.client_id), clientSecret: String(strava.client_secret) };
        }
      } catch (err) {
        this.logger.warn(`Failed to read config from ${filePath}: ${err}`);
      }
    }

    return null;
  }

  requireAppCredentials(): StravaAppCredentials {
    if (!this.credentials) {
      this.credentials = this.readAppCredentials();
    }
    if (!this.credentials) {
      throw new Error('Strava client credentials not configured. Set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET.');
    }
    return this.credentials;
  }

  async getUserStatus(userId: string): Promise<{ connected: boolean; lastSyncAt: Date | null; stravaConnectedAt: Date | null }> {
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) return { connected: false, lastSyncAt: null, stravaConnectedAt: null };
    return {
      connected: !!(user as any).stravaAccessToken,
      lastSyncAt: (user as any).lastSyncAt || null,
      stravaConnectedAt: (user as any).stravaConnectedAt || null,
    };
  }

  async saveTokensForUser(userId: string, tokens: StravaTokens): Promise<void> {
    const update: Record<string, unknown> = {
      stravaAccessToken: tokens.accessToken,
      stravaRefreshToken: tokens.refreshToken,
      stravaExpiresAt: tokens.expiresAt,
      stravaConnectedAt: new Date(),
    };
    if (tokens.athleteId != null) {
      update.stravaAthleteId = tokens.athleteId;
    }

    await this.userModel.findByIdAndUpdate(userId, { $set: update }).exec();
    this.logger.log(`Saved Strava tokens for user ${userId}`);
  }

  async disconnectUser(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $unset: {
        stravaAccessToken: 1,
        stravaRefreshToken: 1,
        stravaExpiresAt: 1,
        stravaAthleteId: 1,
        stravaConnectedAt: 1,
      },
    }).exec();
  }

  async getValidAccessToken(userId: string): Promise<string | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !(user as any).stravaAccessToken) return null;

    const creds = this.requireAppCredentials();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = (user as any).stravaExpiresAt || 0;

    if (expiresAt > now + 60) {
      return (user as any).stravaAccessToken;
    }

    try {
      const res = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: creds.clientId,
          client_secret: creds.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: (user as any).stravaRefreshToken,
        }),
      });

      if (!res.ok) {
        this.logger.warn(`Strava token refresh failed for user ${userId}: ${res.status}`);
        return null;
      }

      const data = await res.json();
      (user as any).stravaAccessToken = data.access_token;
      (user as any).stravaRefreshToken = data.refresh_token;
      (user as any).stravaExpiresAt = data.expires_at;
      await user.save();

      return data.access_token;
    } catch (err) {
      this.logger.error(`Strava token refresh error for user ${userId}: ${err}`);
      return null;
    }
  }

  async stravaFetch(userId: string, path: string): Promise<any> {
    const token = await this.getValidAccessToken(userId);
    if (!token) return null;

    try {
      const res = await fetch(`${STRAVA_API}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 429) {
        this.logger.warn(`Strava rate limit hit for user ${userId}`);
        return null;
      }
      if (!res.ok) return null;
      return res.json();
    } catch (err) {
      this.logger.error(`Strava fetch failed for user ${userId}: ${err}`);
      return null;
    }
  }
}
