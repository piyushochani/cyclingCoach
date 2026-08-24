import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/user.schema';
import { StravaTokenService, StravaTokens } from './strava-token.service';

@Injectable()
export class StravaAuthService {
  private readonly logger = new Logger(StravaAuthService.name);

  constructor(
    private readonly tokenService: StravaTokenService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getStatus(userId: string): Promise<{ connected: boolean; lastSyncAt: Date | null; stravaConnectedAt: Date | null }> {
    return this.tokenService.getUserStatus(userId);
  }

  getAuthUrl(userId: string): { url: string } {
    const { clientId } = this.tokenService.requireAppCredentials();
    const redirectUri = this.tokenService.getRedirectUri();
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64url');
    const url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read,activity:read_all,profile:read_all&state=${state}`;
    return { url };
  }

  async exchangeAndStore(userId: string, code: string): Promise<{ success: true }> {
    const tokens = await this.exchangeCode(code);
    await this.storeTokensForUser(userId, tokens);
    return { success: true };
  }

  async exchangeCode(code: string): Promise<StravaTokens & { athleteId: number }> {
    const { clientId, clientSecret } = this.tokenService.requireAppCredentials();
    const redirectUri = this.tokenService.getRedirectUri();

    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Strava token exchange failed: ${body}`);
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_at: number;
      athlete: { id: number };
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      athleteId: data.athlete.id,
    };
  }

  async storeTokensForUser(userId: string, tokens: StravaTokens): Promise<void> {
    if (tokens.athleteId != null) {
      const existing = await this.userModel.findOne({
        stravaAthleteId: tokens.athleteId,
        _id: { $ne: userId },
      }).lean().exec();
      if (existing) {
        throw new ConflictException('This Strava account is already linked to another user.');
      }
    }

    await this.tokenService.saveTokensForUser(userId, tokens);
  }

  async disconnect(userId: string): Promise<void> {
    await this.tokenService.disconnectUser(userId);
  }

  parseState(state: string | null, fallbackUserId: string): string {
    if (!state) return fallbackUserId;
    try {
      const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'));
      if (parsed?.userId) return String(parsed.userId);
    } catch {
      this.logger.warn('Invalid Strava OAuth state parameter');
    }
    return fallbackUserId;
  }
}
