import { Controller, Get, Post, Put, Delete, Param, Body, UnauthorizedException } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { GearService } from './gear.service';
import { CreateBikeDto, UpdateBikeDto, CreateEquipmentDto, UpdateEquipmentDto } from './dto/gear.dto';

@Controller('gear')
export class GearController {
  constructor(private readonly gearService: GearService) {}

  @Get('bikes')
  findAllBikes(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.gearService.findAllBikes(userId);
  }

  @Post('bikes')
  createBike(@Body() data: CreateBikeDto, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.gearService.createBike(data, userId);
  }

  @Put('bikes/:id')
  updateBike(@Param('id') id: string, @Body() data: UpdateBikeDto, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.gearService.updateBike(id, data, userId);
  }

  @Delete('bikes/:id')
  deleteBike(@Param('id') id: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.gearService.deleteBike(id, userId);
  }

  @Get('equipment')
  findAllEquipment(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.gearService.findAllEquipment(userId);
  }

  @Post('equipment')
  createEquipment(@Body() data: CreateEquipmentDto, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.gearService.createEquipment(data, userId);
  }

  @Put('equipment/:id')
  updateEquipment(@Param('id') id: string, @Body() data: UpdateEquipmentDto, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.gearService.updateEquipment(id, data, userId);
  }

  @Delete('equipment/:id')
  deleteEquipment(@Param('id') id: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.gearService.deleteEquipment(id, userId);
  }
}
