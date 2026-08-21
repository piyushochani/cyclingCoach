import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiUsageService } from './api-usage.service';

@Injectable()
export class ApiUsageAuthGuard implements CanActivate {
  constructor(private readonly apiUsageService: ApiUsageService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization as string | undefined;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('API usage authentication required');
    }

    const token = authHeader.slice(7);
    request.apisageUser = this.apiUsageService.verifyToken(token);
    return true;
  }
}