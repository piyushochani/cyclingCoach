import { Module } from '@nestjs/common';
import { StravaAuthController } from './strava-auth.controller';
import { StravaAuthService } from './strava-auth.service';

@Module({
  controllers: [StravaAuthController],
  providers: [StravaAuthService],
})
export class StravaAuthModule {}
