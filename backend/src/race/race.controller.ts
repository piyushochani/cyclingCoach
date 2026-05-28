import { Controller, Get, Post, Put, Delete, Body, Param, UnauthorizedException } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { RaceService } from './race.service';

@Controller('races')
export class RaceController {
  constructor(private readonly raceService: RaceService) {}

  @Get()
  findAll(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.raceService.findAllByUserId(userId);
  }

  @Get(':id')
  findById(@Param('id') id: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.raceService.findById(id);
  }

  @Post()
  create(@Body() raceData: any, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.raceService.create({ ...raceData, user: userId });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() raceData: any, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.raceService.update(id, raceData, userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.raceService.delete(id, userId);
  }
}
