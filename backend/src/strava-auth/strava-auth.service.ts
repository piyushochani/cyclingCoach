import { Injectable, Logger } from '@nestjs/common';
import { readFileSync, existsSync, writeFileSync, appendFileSync } from 'fs';
import { homedir } from 'os';
import { join, resolve, dirname } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

@Injectable()
export class StravaAuthService {
  private readonly logger = new Logger(StravaAuthService.name);

  private configPaths = [
    join(homedir(), '.cycling-coach', 'config.yaml'),
    join(homedir(), '.config', 'cycling-coach', 'config.yaml'),
    join(homedir(), '.enduragent', 'cycling-coach', 'config.yaml'),
  ];

  private projectRoot = resolve(__dirname, '..', '..', '..');

  private readStravaConfig(): { clientId: string; clientSecret: string } {
    for (const filePath of this.configPaths) {
      if (existsSync(filePath)) {
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
    }
    throw new Error('Strava credentials not found in config.yaml');
  }

  private findConfigPath(): string | null {
    for (const filePath of this.configPaths) {
      if (existsSync(filePath)) return filePath;
    }
    return this.configPaths[0];
  }

  getStatus(): { connected: boolean } {
    for (const filePath of this.configPaths) {
      if (existsSync(filePath)) {
        try {
          const raw = readFileSync(filePath, 'utf-8');
          const config = parseYaml(raw) as any;
          const strava = config?.strava;
          if (strava?.access_token && strava?.refresh_token) {
            return { connected: true };
          }
        } catch {}
      }
    }
    const token = process.env.STRAVA_ACCESS_TOKEN;
    return { connected: !!token };
  }

  getAuthUrl(): { url: string } {
    const { clientId } = this.readStravaConfig();
    const redirectUri = 'http://localhost:3000/auth/strava/callback';
    const url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=read,activity:read_all,profile:read_all`;
    return { url };
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
    const { clientId, clientSecret } = this.readStravaConfig();
    const redirectUri = 'http://localhost:3000/auth/strava/callback';

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
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
    };
  }

  async storeTokens(accessToken: string, refreshToken: string, expiresAt: number): Promise<void> {
    // 1. Write to config.yaml
    const configPath = this.findConfigPath();
    if (configPath) {
      try {
        let content = readFileSync(configPath, 'utf-8');
        const updates: Record<string, string> = {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: String(expiresAt),
        };
        for (const [key, val] of Object.entries(updates)) {
          const lineRegex = new RegExp(`^(\\s*)(${key}:\\s*).*$`, 'm');
          if (lineRegex.test(content)) {
            content = content.replace(lineRegex, `$1$2${val}`);
          } else if (/^(\s*)strava:/m.test(content)) {
            content = content.replace(/^(\s*strava:.*)$/m, `$1\n    ${key}: ${val}`);
          }
        }
        writeFileSync(configPath, content, 'utf-8');
        this.logger.log(`Updated tokens in ${configPath}`);
      } catch (err) {
        this.logger.error(`Failed to write tokens to config.yaml: ${err}`);
      }
    }

    // 2. Write to root .env and backend .env
    const envFiles = [
      join(this.projectRoot, '.env'),
      join(this.projectRoot, 'backend', '.env'),
    ];
    for (const envPath of envFiles) {
      try {
        let content = '';
        if (existsSync(envPath)) {
          content = readFileSync(envPath, 'utf-8');
        }
        const envUpdates: Record<string, string> = {
          STRAVA_ACCESS_TOKEN: accessToken,
          STRAVA_REFRESH_TOKEN: refreshToken,
          STRAVA_EXPIRES_AT: String(expiresAt),
        };
        for (const [key, val] of Object.entries(envUpdates)) {
          const lineRegex = new RegExp(`^#?\\s*${key}=.*$`, 'm');
          if (lineRegex.test(content)) {
            content = content.replace(lineRegex, `${key}=${val}`);
          } else {
            content += (content.endsWith('\n') ? '' : '\n') + `${key}=${val}\n`;
          }
        }
        writeFileSync(envPath, content, 'utf-8');
        this.logger.log(`Updated tokens in ${envPath}`);
      } catch (err) {
        this.logger.error(`Failed to write tokens to ${envPath}: ${err}`);
      }
    }
  }
}
