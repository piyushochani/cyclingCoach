import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../user/user.schema';
import { Otp } from './auth.schema';
import { EmailService } from '../email/email.service';
import { ClerkOtpService, ClerkOtpRef } from './clerk-otp.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Otp.name) private otpModel: Model<Otp>,
    private readonly emailService: EmailService,
    private readonly clerkOtpService: ClerkOtpService,
  ) {}

  getOtpMethod(): 'smtp' | 'clerk' {
    return (process.env.OTP_METHOD || 'smtp').trim().toLowerCase() === 'clerk'
      ? 'clerk'
      : 'smtp';
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createOtp(email: string, type: string): Promise<string> {
    await this.otpModel.updateMany({ email, type, used: false }, { used: true });
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    if (this.getOtpMethod() === 'clerk') {
      let ref: ClerkOtpRef;
      try {
        ref = await this.clerkOtpService.sendOtp(email);
      } catch (err: any) {
        this.logger.error(`Failed to send ${type} OTP via Clerk to ${email}: ${err.message}`);
        throw new Error(`Failed to send OTP via Clerk: ${err.message}`);
      }
      await this.otpModel.create({
        email,
        code: '',
        provider: 'clerk',
        providerRef: JSON.stringify(ref),
        type,
        expiresAt,
      });
      return '';
    }

    const code = this.generateOtpCode();
    await this.otpModel.create({ email, code, type, expiresAt });
    try {
      await this.emailService.sendOtpEmail(email, code, type);
    } catch (err: any) {
      this.logger.error(`Failed to send ${type} OTP email to ${email}: ${err.message}`);
      throw new Error(`Failed to send OTP email: ${err.message}`);
    }
    return code;
  }

  async verifyOtp(email: string, code: string, type: string): Promise<boolean> {
    const otp = await this.otpModel
      .findOne({ email, type, used: false })
      .sort({ createdAt: -1 });
    if (!otp) return false;
    if (new Date() > otp.expiresAt) return false;

    if (otp.provider === 'clerk') {
      let ref: ClerkOtpRef;
      try {
        ref = JSON.parse(otp.providerRef || '{}');
      } catch {
        return false;
      }
      if (!ref?.emailAddressId || !ref?.verificationId) return false;
      const ok = await this.clerkOtpService.verifyOtp(ref, code);
      if (ok) {
        otp.used = true;
        await otp.save();
      }
      return ok;
    }

    if (otp.code !== code) return false;
    otp.used = true;
    await otp.save();
    return true;
  }

  async signup(email: string, password: string, data: Record<string, any>): Promise<User> {
    const passwordHash = await this.hashPassword(password);
    const user = await this.userModel.create({
      firstName: data.firstName,
      lastName: data.lastName || '',
      email,
      passwordHash,
      mainSport: 'cycling',
      experienceLevel: 'intermediate',
      heightCm: data.heightCm ?? null,
      weightKg: data.weightKg ?? null,
      goal: data.goal || '',
      cyclingYears: data.cyclingYears || 0,
      ftp: data.ftp ?? null,
    } as any);
    return user;
  }

  async login(email: string, password: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) return null;
    const valid = await this.validatePassword(password, user.passwordHash);
    if (!valid) return null;
    return user;
  }

  async changePassword(email: string, currentPassword: string, newPassword: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new Error('User not found');
    const valid = await this.validatePassword(currentPassword, user.passwordHash);
    if (!valid) throw new Error('Current password is incorrect');
    const passwordHash = await this.hashPassword(newPassword);
    user.passwordHash = passwordHash;
    await user.save();
    await this.emailService.sendPasswordChangeNotification(email, user.firstName).catch((err) => {
      this.logger.error(`Failed to send password change email: ${err.message}`);
    });
    return user;
  }

  async updatePassword(email: string, newPassword: string): Promise<void> {
    const passwordHash = await this.hashPassword(newPassword);
    await this.userModel.updateOne({ email }, { passwordHash }).exec();
  }
}
