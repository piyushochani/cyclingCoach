import { Controller, Get, Post, Put, Delete, Body, Param, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { RaceService } from './race.service';
import { CreateRaceDto, UpdateRaceDto } from './dto/race.dto';

@Controller('races')
export class RaceController {
  constructor(private readonly raceService: RaceService) {}

  @Get()
  findAll(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.raceService.findAllByUserId(userId);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    const race = await this.raceService.findById(id, userId);
    if (!race) throw new NotFoundException('Race not found');
    return race;
  }

  @Post()
  create(@Body() raceData: CreateRaceDto, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.raceService.create({
      ...raceData,
      date: new Date(raceData.date),
      user: userId as any,
    });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() raceData: UpdateRaceDto, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.raceService.update(id, {
      ...raceData,
      date: new Date(raceData.date),
    }, userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.raceService.delete(id, userId);
  }
}
