import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentCardsController } from './payment-cards.controller';
import { PaymentCardsService } from './payment-cards.service';
import { PaymentCard, PaymentCardSchema } from './payment-card.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentCard.name, schema: PaymentCardSchema },
    ]),
  ],
  controllers: [PaymentCardsController],
  providers: [PaymentCardsService],
  exports: [PaymentCardsService],
})
export class PaymentCardsModule {}
