import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Race, RaceSchema } from './race.schema';
import { RacePlan, RacePlanSchema } from './race-plan.schema';
import { DietPlan, DietPlanSchema } from './diet-plan.schema';
import { RaceNutrition, RaceNutritionSchema } from './race-nutrition.schema';
import { AISuggestion, AISuggestionSchema } from './ai-suggestion.schema';
import { RaceChat, RaceChatSchema } from './race-chat.schema';
import { RaceService } from './race.service';
import { RaceController } from './race.controller';
import { RacePlanService } from './race-plan.service';
import { RacePlanController } from './race-plan.controller';
import { RaceChatService } from './race-chat.service';
import { RaceChatController } from './race-chat.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Race.name, schema: RaceSchema },
      { name: RacePlan.name, schema: RacePlanSchema },
      { name: DietPlan.name, schema: DietPlanSchema },
      { name: RaceNutrition.name, schema: RaceNutritionSchema },
      { name: AISuggestion.name, schema: AISuggestionSchema },
      { name: RaceChat.name, schema: RaceChatSchema },
    ]),
  ],
  controllers: [RaceController, RacePlanController, RaceChatController],
  providers: [RaceService, RacePlanService, RaceChatService],
  exports: [RaceService],
})
export class RaceModule {}
