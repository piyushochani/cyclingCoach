import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Race, RaceSchema } from './race.schema';
import { RaceService } from './race.service';
import { RaceController } from './race.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Race.name, schema: RaceSchema }])],
  controllers: [RaceController],
  providers: [RaceService],
  exports: [RaceService],
})
export class RaceModule {}
