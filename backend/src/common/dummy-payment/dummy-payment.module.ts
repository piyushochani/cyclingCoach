import { Module, Global } from '@nestjs/common';
import { DummyPaymentService } from './dummy-payment.service';

@Global()
@Module({
  providers: [DummyPaymentService],
  exports: [DummyPaymentService],
})
export class DummyPaymentModule {}
