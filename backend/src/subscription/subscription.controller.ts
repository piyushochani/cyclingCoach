import { Controller, Get, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { UserId } from '../common/user-id.decorator';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  async getStatus(@UserId() userId: string) {
    return this.subscriptionService.getStatus(userId);
  }

  @Get('renewal-status')
  async renewalStatus(@UserId() userId: string) {
    return this.subscriptionService.getRenewalStatus(userId);
  }

  @Post('cancel')
  async cancel(@UserId() userId: string) {
    return this.subscriptionService.cancel(userId);
  }

  @Post('reactivate')
  async reactivate(@UserId() userId: string) {
    return this.subscriptionService.reactivate(userId);
  }
}
