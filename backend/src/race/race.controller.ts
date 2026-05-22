import { Controller, Get, Post, Body } from '@nestjs/common';
import { RaceService } from './race.service';

@Controller('races')
export class RaceController {
  constructor(private readonly raceService: RaceService) {}

  @Get()
  findAll() {
    return this.raceService.findAll();
  }

  @Post()
  create(@Body() raceData: any) {
    return this.raceService.create(raceData);
  }
}
