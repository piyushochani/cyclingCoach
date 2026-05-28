import { Controller, Get, Post, Body } from '@nestjs/common';
import { StravaAuthService } from './strava-auth.service';

@Controller('strava')
export class StravaAuthController {
  constructor(private readonly stravaAuthService: StravaAuthService) {}

  @Get('status')
  getStatus() {
    return this.stravaAuthService.getStatus();
  }

  @Get('auth-url')
  getAuthUrl() {
    return this.stravaAuthService.getAuthUrl();
  }

  @Post('exchange')
  async exchangeCode(@Body() body: { code: string }) {
    return this.stravaAuthService.exchangeCode(body.code);
  }

  @Post('store-tokens')
  async storeTokens(@Body() body: { accessToken: string; refreshToken: string; expiresAt: number }) {
    await this.stravaAuthService.storeTokens(body.accessToken, body.refreshToken, body.expiresAt);
    return { success: true };
  }
}
