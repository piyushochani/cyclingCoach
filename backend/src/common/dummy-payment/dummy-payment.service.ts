import { Injectable, Logger, BadRequestException } from '@nestjs/common';

@Injectable()
export class DummyPaymentService {
  private readonly logger = new Logger(DummyPaymentService.name);

  validateCard(cardNumber: string, expiry: string, cvc: string): { lastFour: string; expiryMonth: number; expiryYear: number; brand: string; cardHolderName: string } {
    const expectedCard = process.env.DUMMY_CARD || '111111111111';
    const expectedExpiry = process.env.DUMMY_EXPIRY || '11/11';
    const expectedCvc = process.env.DUMMY_CVC || '111';

    const cleanCard = cardNumber.replace(/\s/g, '');
    const cleanExpiry = expiry.replace(/\s/g, '');
    const cleanCvc = cvc.replace(/\s/g, '');

    if (cleanCard !== expectedCard) {
      throw new BadRequestException('Invalid card number');
    }
    if (cleanExpiry !== expectedExpiry) {
      throw new BadRequestException('Invalid expiry date');
    }
    if (cleanCvc !== expectedCvc) {
      throw new BadRequestException('Invalid CVC');
    }

    const [month, year] = cleanExpiry.split('/');
    const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);

    return {
      lastFour: cleanCard.slice(-4),
      expiryMonth: parseInt(month),
      expiryYear: fullYear,
      brand: 'dummy',
      cardHolderName: 'Dummy Card',
    };
  }
}
