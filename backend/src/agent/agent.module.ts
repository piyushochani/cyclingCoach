import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentMemory, AgentMemorySchema } from './agent-memory.schema';
import { AgentChatHistory, AgentChatHistorySchema } from './agent-chat-history.schema';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentMemoryService } from './agent-memory.service';
import { AgentChatStoreService } from './agent-chat-store.service';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { User, UserSchema } from '../user/user.schema';
import { Activity, ActivitySchema } from '../activity/activity.schema';
import { Bike, BikeSchema, Equipment, EquipmentSchema } from '../gear/gear.schema';
import { Race, RaceSchema } from '../race/race.schema';
import { TrainingContextModule } from '../training-context/training-context.module';
import { AnalysisModule } from '../analysis/analysis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AgentMemory.name, schema: AgentMemorySchema },
      { name: AgentChatHistory.name, schema: AgentChatHistorySchema },
      { name: User.name, schema: UserSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Bike.name, schema: BikeSchema },
      { name: Equipment.name, schema: EquipmentSchema },
      { name: Race.name, schema: RaceSchema },
    ]),
    forwardRef(() => TrainingContextModule),
    forwardRef(() => AnalysisModule),
  ],
  controllers: [AgentController, FaqController],
  providers: [AgentService, AgentMemoryService, AgentChatStoreService, FaqService],
  exports: [AgentService, FaqService],
})
export class AgentModule {}
