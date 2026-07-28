import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
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

  @Post('purchase')
  async purchase(
    @UserId() userId: string,
    @Body() body: { planId: string; cardNumber: string; expiry: string; cvc: string },
  ) {
    if (!body.planId) throw new BadRequestException('planId is required');
    if (!body.cardNumber || !body.expiry || !body.cvc) {
      throw new BadRequestException('cardNumber, expiry, and cvc are required');
    }
    return this.subscriptionService.purchase(userId, body.planId, body.cardNumber, body.expiry, body.cvc);
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
