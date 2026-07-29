import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/public.decorator';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminUser } from './admin-user.decorator';
import { AdminAuditService } from './admin-audit.service';

@Public()
@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly auditService: AdminAuditService,
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() body: AdminLoginDto) {
    return this.adminAuthService.login(body.username, body.password);
  }

  @Post('logout')
  @UseGuards(AdminAuthGuard)
  async logout(@AdminUser() admin: { username: string }) {
    await this.auditService.log(admin.username, 'logout');
    return { message: 'Logged out' };
  }
}
