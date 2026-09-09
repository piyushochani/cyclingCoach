import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiUsage, ApiUsageSchema } from './api-usage.schema';
import { ApiUsageService } from './api-usage.service';
import { ApiUsageAuthGuard } from './api-usage-auth.guard';
import { ApiUsageController } from './api-usage.controller';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: ApiUsage.name, schema: ApiUsageSchema }]),
  ],
  controllers: [ApiUsageController],
  providers: [ApiUsageService, ApiUsageAuthGuard],
  exports: [ApiUsageService, ApiUsageAuthGuard],
})
export class ApiUsageModule {}