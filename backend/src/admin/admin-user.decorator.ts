import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AdminJwtPayload } from './admin-auth.service';

export const AdminUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminJwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.adminUser;
  },
);
