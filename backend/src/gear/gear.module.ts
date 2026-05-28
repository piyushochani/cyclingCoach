import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bike, BikeSchema, Equipment, EquipmentSchema } from './gear.schema';
import { GearService } from './gear.service';
import { GearController } from './gear.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bike.name, schema: BikeSchema },
      { name: Equipment.name, schema: EquipmentSchema },
    ]),
  ],
  controllers: [GearController],
  providers: [GearService],
  exports: [GearService],
})
export class GearModule {}
