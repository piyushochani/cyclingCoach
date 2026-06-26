import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: any;
  private readonly logger = new Logger(StripeService.name);

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      this.logger.warn('STRIPE_SECRET_KEY not set — Stripe calls will fail');
    }
    this.stripe = new Stripe(key || 'sk_test_placeholder');
  }

  async createSetupIntent(customerId?: string) {
    return this.stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
  }

  async createCustomer(email: string, name: string) {
    return this.stripe.customers.create({ email, name });
  }

  async getPaymentMethod(paymentMethodId: string) {
    return this.stripe.paymentMethods.retrieve(paymentMethodId);
  }
}
