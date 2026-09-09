import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminAuditService } from './admin-audit.service';

export interface AdminJwtPayload {
  sub: string;
  username: string;
  role: 'admin';
}

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly auditService: AdminAuditService,
  ) {}

  private getAdminSecret(): string {
    const isProduction = process.env.NODE_ENV === 'production';
    const secret = process.env.ADMIN_JWT_SECRET;
    if (!secret) {
      if (isProduction) {
        throw new Error('ADMIN_JWT_SECRET must be set in production');
      }
      this.logger.warn('ADMIN_JWT_SECRET is not set — using insecure dev-only fallback');
      return 'admin-dev-only-fallback';
    }
    return secret;
  }

  async login(username: string, password: string): Promise<{ token: string; username: string }> {
    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedUsername || !expectedPassword) {
      this.logger.error('ADMIN_USERNAME or ADMIN_PASSWORD not configured');
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid =
      username === expectedUsername &&
      password === expectedPassword;

    if (!valid) {
      await this.auditService.log(username, 'login_failed');
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: AdminJwtPayload = {
      sub: 'admin',
      username: expectedUsername,
      role: 'admin',
    };

    const expiresIn = (process.env.ADMIN_JWT_EXPIRES_IN || '8h') as `${number}${'s' | 'm' | 'h' | 'd'}`;
    const token = this.jwtService.sign(payload, {
      secret: this.getAdminSecret(),
      expiresIn,
    });

    await this.auditService.log(expectedUsername, 'login_success');

    return { token, username: expectedUsername };
  }

  verifyToken(token: string): AdminJwtPayload {
    try {
      const payload = this.jwtService.verify<AdminJwtPayload>(token, {
        secret: this.getAdminSecret(),
      });
      if (payload.role !== 'admin') {
        throw new UnauthorizedException('Invalid admin token');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired admin token');
    }
  }
}
