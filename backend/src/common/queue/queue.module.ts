import { DynamicModule, Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { isRedisEnabled, resolveRedisConnection } from './queue.constants';
import { BackgroundJob, BackgroundJobSchema } from './job-status.schema';
import { JobStatusService } from './job-status.service';
import { QueueEnqueueService } from './queue-enqueue.service';
import { JobsController } from './jobs.controller';

@Global()
@Module({})
export class QueueModule {
  static forRoot(): DynamicModule {
    const redisEnabled = isRedisEnabled();
    const imports: DynamicModule['imports'] = [
      MongooseModule.forFeature([{ name: BackgroundJob.name, schema: BackgroundJobSchema }]),
    ];

    if (redisEnabled) {
      imports.push(
        BullModule.forRoot({
          connection: resolveRedisConnection(),
        }),
      );
    }

    return {
      module: QueueModule,
      global: true,
      imports,
      controllers: [JobsController],
      providers: [JobStatusService, QueueEnqueueService],
      exports: [JobStatusService, QueueEnqueueService, ...(redisEnabled ? [BullModule] : [])],
    };
  }
}
