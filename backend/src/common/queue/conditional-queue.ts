import { DynamicModule, Provider } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MockQueue } from './mock-queue';

export function createQueueModule(name: string): DynamicModule {
  const redisEnabled = process.env.REDIS_ENABLED !== 'false';

  if (redisEnabled) {
    return BullModule.registerQueue({ name });
  }

  const provider: Provider = {
    provide: `BullQueue_${name}`,
    useFactory: () => new MockQueue(name),
  };

  return {
    module: class ConditionalQueueModule {},
    providers: [provider],
    exports: [provider],
  };
}
