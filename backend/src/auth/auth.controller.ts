import { Controller, Post, Body, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SyncService } from '../sync/sync.service';

const SYNC_MONTHS = parseInt(process.env.STRAVA_SYNC_MONTHS || '6', 10);

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly syncService: SyncService,
  ) {}

  @Post('signup-request')
  async signupRequest(@Body() body: { email: string }) {
    if (!body.email) throw new BadRequestException('Email is required');
    const existing = await this.authService.findUserByEmail(body.email);
    if (existing) throw new ConflictException('Email already registered');
    await this.authService.createOtp(body.email, 'signup');
    return { message: 'OTP sent to email' };
  }

  @Post('signup-verify')
  async signupVerify(@Body() body: {
    email: string; code: string; password: string;
    firstName: string; lastName?: string;
    heightCm?: number; weightKg?: number;
    goal?: string; cyclingYears?: number; ftp?: number;
  }) {
    if (!body.email || !body.code || !body.password || !body.firstName) {
      throw new BadRequestException('Email, password, and first name are required');
    }
    if (body.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    const valid = await this.authService.verifyOtp(body.email, body.code, 'signup');
    if (!valid) throw new UnauthorizedException('Invalid or expired OTP');
    await this.authService.signup(body.email, body.password, {
      firstName: body.firstName,
      lastName: body.lastName,
      heightCm: body.heightCm,
      weightKg: body.weightKg,
      goal: body.goal,
      cyclingYears: body.cyclingYears,
      ftp: body.ftp,
    });
    return { message: 'Account created successfully' };
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    if (!body.email || !body.password) throw new BadRequestException('Email and password are required');
    const user = await this.authService.login(body.email, body.password);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    // Auto-sync on login
    if (user.stravaUpdatedAt) {
      const cutoff = new Date(Date.now() - SYNC_MONTHS * 30 * 24 * 3600 * 1000);
      const lastActivity = await this.syncService.getLatestActivityDate(user._id as any);
      const isUpToDate = user.isStravaUpToDate && lastActivity && lastActivity >= cutoff;
      console.log(`\n  ╔══════════════════════════════════════════╗`);
      console.log(`  ║         Strava Sync Status               ║`);
      console.log(`  ╠══════════════════════════════════════════╣`);
      console.log(`  ║  Last synced : ${(user.stravaUpdatedAt?.toISOString().slice(0, 19) || 'never').padEnd(25)}║`);
      console.log(`  ║  Up to date  : ${String(isUpToDate).padEnd(25)}║`);
      console.log(`  ║  Window      : ${`${SYNC_MONTHS} months`.padEnd(25)}║`);
      console.log(`  ╚══════════════════════════════════════════╝\n`);

      if (!isUpToDate) {
        console.log('  → Auto-triggering incremental sync...');
        this.syncService.incrementalSync(user._id as any).then((r) => {
          console.log(`  → Sync complete: ${r.newActivities} new activities`);
        }).catch(() => {});
      }
    } else {
      console.log(`\n  ╔══════════════════════════════════════════╗`);
      console.log(`  ║         Strava Sync Status               ║`);
      console.log(`  ╠══════════════════════════════════════════╣`);
      console.log(`  ║  Never synced                            ║`);
      console.log(`  ╚══════════════════════════════════════════╝\n`);
    }

    return {
      id: user._id,
      firstName: user.firstName || (user as any).name || '',
      lastName: user.lastName || '',
      email: user.email,
      mainSport: user.mainSport,
      experienceLevel: user.experienceLevel,
      heightCm: user.heightCm,
      weightKg: user.weightKg,
      goal: user.goal,
      cyclingYears: user.cyclingYears,
      ftp: user.ftp,
      stravaUpdatedAt: user.stravaUpdatedAt,
      isStravaUpToDate: user.isStravaUpToDate,
    };
  }

  @Post('change-password')
  async changePassword(@Body() body: { email: string; currentPassword: string; newPassword: string }) {
    if (!body.email || !body.currentPassword || !body.newPassword) {
      throw new BadRequestException('All fields are required');
    }
    if (body.newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }
    if (body.currentPassword === body.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }
    try {
      await this.authService.changePassword(body.email, body.currentPassword, body.newPassword);
      return { message: 'Password changed successfully' };
    } catch (err: any) {
      if (err.message === 'Current password is incorrect') {
        throw new UnauthorizedException('Current password is incorrect');
      }
      throw new BadRequestException(err.message);
    }
  }

  @Post('forgot-password-request')
  async forgotPasswordRequest(@Body() body: { email: string }) {
    if (!body.email) throw new BadRequestException('Email is required');
    const user = await this.authService.findUserByEmail(body.email);
    if (!user) return { message: 'If the email exists, an OTP has been sent' };
    await this.authService.createOtp(body.email, 'password-reset');
    return { message: 'If the email exists, an OTP has been sent' };
  }

  @Post('forgot-password-reset')
  async forgotPasswordReset(@Body() body: { email: string; code: string; password: string }) {
    if (!body.email || !body.code || !body.password) {
      throw new BadRequestException('All fields are required');
    }
    if (body.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    const valid = await this.authService.verifyOtp(body.email, body.code, 'password-reset');
    if (!valid) throw new UnauthorizedException('Invalid or expired OTP');
    await this.authService.updatePassword(body.email, body.password);
    return { message: 'Password updated successfully' };
  }
}
