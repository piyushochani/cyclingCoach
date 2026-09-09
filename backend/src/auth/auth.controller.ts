import { Controller, Post, Get, Body, UnauthorizedException, ConflictException, BadRequestException, ServiceUnavailableException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { SyncService } from '../sync/sync.service';
import { Public } from '../common/public.decorator';

const SYNC_MONTHS = parseInt(process.env.STRAVA_SYNC_MONTHS || '6', 10);
const OTP_ENABLED = process.env.OTP_ENABLED !== 'false';

@Public()
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly syncService: SyncService,
    private readonly jwtService: JwtService,
  ) {}

  private generateToken(user: any): string {
    return this.jwtService.sign({ sub: user._id, email: user.email });
  }

  private userResponse(user: any) {
    return {
      token: this.generateToken(user),
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
    };
  }

  @Get('config')
  getConfig() {
    return {
      otpEnabled: OTP_ENABLED,
      otpMethod: OTP_ENABLED
        ? this.authService.getOtpMethod()
        : null,
    };
  }

  @Post('signup-request')
  async signupRequest(@Body() body: { email: string }) {
    if (!body.email) throw new BadRequestException('Email is required');
    const existing = await this.authService.findUserByEmail(body.email);
    if (existing) throw new ConflictException('Email already registered');
    if (!OTP_ENABLED) {
      return { message: 'OTP verification is disabled', otpRequired: false };
    }
    try {
      await this.authService.createOtp(body.email, 'signup');
    } catch (err: any) {
      throw new ServiceUnavailableException('Could not send OTP email. Please try again.');
    }
    return { message: 'OTP sent to email', otpRequired: true };
  }

  @Post('signup-verify')
  async signupVerify(@Body() body: {
    email: string; code: string; password: string;
    firstName: string; lastName?: string;
    heightCm?: number; weightKg?: number;
    goal?: string; cyclingYears?: number; ftp?: number;
  }) {
    if (!body.email || !body.password || !body.firstName) {
      throw new BadRequestException('Email, password, and first name are required');
    }
    if (body.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    if (OTP_ENABLED) {
      if (!body.code) throw new BadRequestException('OTP code is required');
      let valid = false;
      try {
        valid = await this.authService.verifyOtp(body.email, body.code, 'signup');
      } catch (err: any) {
        this.logger.error(`OTP verification failed for ${body.email}: ${err.message}`);
        throw new ServiceUnavailableException('Could not verify OTP. Please try again.');
      }
      if (!valid) throw new UnauthorizedException('Invalid or expired OTP');
    }
    const user = await this.authService.signup(body.email, body.password, {
      firstName: body.firstName,
      lastName: body.lastName,
      heightCm: body.heightCm,
      weightKg: body.weightKg,
      goal: body.goal,
      cyclingYears: body.cyclingYears,
      ftp: body.ftp,
    });
    return this.userResponse(user);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    if (!body.email || !body.password) throw new BadRequestException('Email and password are required');
    const user = await this.authService.login(body.email, body.password);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    if ((user as any).stravaAccessToken || user.stravaUpdatedAt) {
      const cutoff = new Date(Date.now() - SYNC_MONTHS * 30 * 24 * 3600 * 1000);
      const lastActivity = await this.syncService.getLatestActivityDate(user._id as any);
      const isUpToDate = user.isStravaUpToDate && lastActivity && lastActivity >= cutoff;

      if (!isUpToDate) {
        this.syncService.incrementalSync(user._id as any).then((r) => {
          this.logger.log(`Sync complete: ${r.newActivities} new activities`);
        }).catch((err) => {
          this.logger.warn(`Sync failed: ${err.message}`);
        });
      }
    }

    return {
      ...this.userResponse(user),
      stravaConnected: !!(user as any).stravaAccessToken,
      stravaUpdatedAt: user.stravaUpdatedAt,
      isStravaUpToDate: user.isStravaUpToDate,
      onboardingSummary: (user as any).onboardingSummary || null,
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
    if (!OTP_ENABLED) {
      return { message: 'If the email exists, an OTP has been sent', otpDisabled: true };
    }
    const user = await this.authService.findUserByEmail(body.email);
    if (!user) return { message: 'If the email exists, an OTP has been sent' };
    try {
      await this.authService.createOtp(body.email, 'password-reset');
    } catch (err: any) {
      throw new ServiceUnavailableException('Could not send OTP email. Please try again.');
    }
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
    let valid = false;
    try {
      valid = await this.authService.verifyOtp(body.email, body.code, 'password-reset');
    } catch (err: any) {
      this.logger.error(`OTP verification failed for ${body.email}: ${err.message}`);
      throw new ServiceUnavailableException('Could not verify OTP. Please try again.');
    }
    if (!valid) throw new UnauthorizedException('Invalid or expired OTP');
    await this.authService.updatePassword(body.email, body.password);
    const user = await this.authService.findUserByEmail(body.email);
    if (!user) throw new UnauthorizedException('User not found');
    return {
      ...this.userResponse(user),
      stravaUpdatedAt: user.stravaUpdatedAt,
      isStravaUpToDate: user.isStravaUpToDate,
      onboardingSummary: (user as any).onboardingSummary || null,
    };
  }
}
