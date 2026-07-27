import { Controller, Get, Post, Body, UnauthorizedException } from '@nestjs/common';
import { StravaAuthService } from './strava-auth.service';
import { UserId } from '../common/user-id.decorator';

@Controller('strava')
export class StravaAuthController {
  constructor(private readonly stravaAuthService: StravaAuthService) {}

  @Get('status')
  getStatus(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.stravaAuthService.getStatus(userId);
  }

  @Get('auth-url')
  getAuthUrl(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.stravaAuthService.getAuthUrl(userId);
  }

  @Post('connect')
  async connect(
    @Body() body: { code: string; state?: string },
    @UserId() userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('User ID required');
    if (!body.code) throw new UnauthorizedException('Authorization code required');

    const resolvedUserId = this.stravaAuthService.parseState(body.state || null, userId);
    if (resolvedUserId !== userId) {
      throw new UnauthorizedException('OAuth state does not match current user');
    }

    return this.stravaAuthService.exchangeAndStore(userId, body.code);
  }

  @Post('disconnect')
  async disconnect(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    await this.stravaAuthService.disconnect(userId);
    return { success: true };
  }
}
