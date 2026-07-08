import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    const secret = process.env.JWT_SECRET || 'fallback-dev-only';
    if (!process.env.JWT_SECRET) {
      Logger.warn('JWT_SECRET is not set — auth-protected routes will reject all requests');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.userModel.findById(payload.sub).exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { id: payload.sub, email: payload.email };
  }
}
