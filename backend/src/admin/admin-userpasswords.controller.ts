import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Public } from '../common/public.decorator';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminUser } from './admin-user.decorator';
import { AdminAuditService } from './admin-audit.service';
import { User } from '../user/user.schema';

@Public()
@UseGuards(AdminAuthGuard)
@Controller('userpasswords')
export class AdminUserPasswordsController {
  constructor(
    private readonly auditService: AdminAuditService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  @Get()
  async listUsers() {
    const users = await this.userModel
      .find()
      .select('firstName lastName email subscriptionTier createdAt')
      .sort({ createdAt: -1 })
      .limit(500)
      .exec();
    return { users };
  }

  @Post('reset')
  async resetPassword(
    @Body() body: { userId?: string; email?: string; newPassword?: string },
    @AdminUser() admin: { username: string },
  ) {
    if (!body.userId && !body.email) {
      throw new BadRequestException('Either userId or email is required');
    }
    if (body.newPassword && body.newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const user = body.userId
      ? await this.userModel.findById(body.userId).exec()
      : await this.userModel.findOne({ email: body.email?.toLowerCase().trim() }).exec();
    if (!user) throw new NotFoundException('User not found');

    let generatedPassword: string | undefined;
    const newPassword = body.newPassword || this.generateTempPassword();
    if (!body.newPassword) generatedPassword = newPassword;

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    await this.auditService.log(admin.username, 'password_reset', 'user', String(user._id), {
      email: user.email,
      generated: Boolean(generatedPassword),
    });

    return {
      message: `Password reset for ${user.email}`,
      email: user.email,
      ...(generatedPassword ? { generatedPassword } : {}),
    };
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 10; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }
}
