import { Controller, Get, Post, Delete, Body, Param, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentCardsService } from './payment-cards.service';
import { StripeService } from '../common/stripe/stripe.service';
import { UserId } from '../common/user-id.decorator';

@Controller('payment-cards')
export class PaymentCardsController {
  constructor(
    private readonly cardsService: PaymentCardsService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('create-setup-intent')
  async createSetupIntent(@UserId() userId: string) {
    if (!userId) throw new NotFoundException('User ID required');
    const setupIntent = await this.stripeService.createSetupIntent();
    return { clientSecret: setupIntent.client_secret };
  }

  @Get()
  async listCards(@UserId() userId: string) {
    if (!userId) throw new NotFoundException('User ID required');
    return this.cardsService.findByUser(userId);
  }

  @Post()
  async addCard(
    @UserId() userId: string,
    @Body() body: {
      stripePaymentMethodId: string;
      cardHolderName?: string;
    },
  ) {
    if (!userId) throw new NotFoundException('User ID required');
    if (!body.stripePaymentMethodId) {
      throw new BadRequestException('stripePaymentMethodId is required');
    }

    const pm = await this.stripeService.getPaymentMethod(body.stripePaymentMethodId);
    if (pm.type !== 'card' || !pm.card) {
      throw new BadRequestException('Invalid payment method — not a card');
    }

    return this.cardsService.addCard(userId, {
      lastFour: pm.card.last4,
      cardHolderName: body.cardHolderName || pm.billing_details?.name || '',
      expiryMonth: pm.card.exp_month,
      expiryYear: pm.card.exp_year,
      brand: pm.card.brand,
      stripePaymentMethodId: body.stripePaymentMethodId,
      cardFingerprint: pm.card.fingerprint,
    });
  }

  @Delete(':id')
  async removeCard(@UserId() userId: string, @Param('id') id: string) {
    if (!userId) throw new NotFoundException('User ID required');
    await this.cardsService.removeCard(userId, id);
    return { success: true };
  }

  @Post(':id/default')
  async setDefault(@UserId() userId: string, @Param('id') id: string) {
    if (!userId) throw new NotFoundException('User ID required');
    return this.cardsService.setDefault(userId, id);
  }
}
