import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentCard } from './payment-card.schema';

@Injectable()
export class PaymentCardsService {
  constructor(
    @InjectModel(PaymentCard.name) private cardModel: Model<PaymentCard>,
  ) {}

  async findByUser(userId: string): Promise<PaymentCard[]> {
    return this.cardModel.find({ user: userId as any }).sort({ isDefault: -1, createdAt: -1 }).exec();
  }

  async addCard(userId: string, data: {
    lastFour: string;
    cardHolderName: string;
    expiryMonth: number;
    expiryYear: number;
    brand: string;
    stripePaymentMethodId?: string;
    cardFingerprint?: string;
  }): Promise<PaymentCard> {
    const cardCount = await this.cardModel.countDocuments({ user: userId as any }).exec();

    const card = new this.cardModel({
      user: userId as any,
      ...data,
      isDefault: cardCount === 0,
    });

    return card.save();
  }

  async removeCard(userId: string, cardId: string): Promise<void> {
    const card = await this.cardModel.findOne({ _id: cardId, user: userId as any }).exec();
    if (!card) throw new NotFoundException('Card not found');

    const wasDefault = card.isDefault;
    await this.cardModel.deleteOne({ _id: cardId }).exec();

    if (wasDefault) {
      const nextCard = await this.cardModel.findOne({ user: userId as any }).sort({ createdAt: -1 }).exec();
      if (nextCard) {
        nextCard.isDefault = true;
        await nextCard.save();
      }
    }
  }

  async setDefault(userId: string, cardId: string): Promise<PaymentCard> {
    const card = await this.cardModel.findOne({ _id: cardId, user: userId as any }).exec();
    if (!card) throw new NotFoundException('Card not found');

    await this.cardModel.updateMany(
      { user: userId as any },
      { $set: { isDefault: false } },
    ).exec();

    card.isDefault = true;
    return card.save();
  }
}
