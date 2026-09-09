import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/user.schema';
import { StravaAuthController } from './strava-auth.controller';
import { StravaAuthService } from './strava-auth.service';
import { StravaTokenService } from './strava-token.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [StravaAuthController],
  providers: [StravaAuthService, StravaTokenService],
  exports: [StravaAuthService, StravaTokenService],
})
export class StravaAuthModule {}
