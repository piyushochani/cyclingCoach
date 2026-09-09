import { Controller, Get, Post, Delete, Body, Param, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentCardsService } from './payment-cards.service';
import { DummyPaymentService } from '../common/dummy-payment/dummy-payment.service';
import { UserId } from '../common/user-id.decorator';

@Controller('payment-cards')
export class PaymentCardsController {
  constructor(
    private readonly cardsService: PaymentCardsService,
    private readonly dummyPaymentService: DummyPaymentService,
  ) {}

  @Get()
  async listCards(@UserId() userId: string) {
    if (!userId) throw new NotFoundException('User ID required');
    return this.cardsService.findByUser(userId);
  }

  @Post()
  async addCard(
    @UserId() userId: string,
    @Body() body: {
      cardNumber: string;
      expiry: string;
      cvc: string;
      cardHolderName?: string;
    },
  ) {
    if (!userId) throw new NotFoundException('User ID required');
    if (!body.cardNumber || !body.expiry || !body.cvc) {
      throw new BadRequestException('cardNumber, expiry, and cvc are required');
    }

    const cardInfo = this.dummyPaymentService.validateCard(body.cardNumber, body.expiry, body.cvc);

    return this.cardsService.addCard(userId, {
      lastFour: cardInfo.lastFour,
      cardHolderName: body.cardHolderName || cardInfo.cardHolderName,
      expiryMonth: cardInfo.expiryMonth,
      expiryYear: cardInfo.expiryYear,
      brand: cardInfo.brand,
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
