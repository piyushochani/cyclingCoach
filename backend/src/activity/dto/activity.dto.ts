import { IsString, IsNumber, IsDateString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateActivityDto {
  @IsOptional()
  @IsNumber()
  stravaId?: number;

  @IsString()
  name: string;

  @IsString()
  sport: string;

  @IsNumber()
  distance: number;

  @IsNumber()
  durationSeconds: number;

  @IsNumber()
  elevationGain: number;

  @IsOptional()
  @IsNumber()
  calories?: number;

  @IsOptional()
  @IsNumber()
  averageWatts?: number;

  @IsOptional()
  @IsNumber()
  maxWatts?: number;

  @IsOptional()
  @IsNumber()
  averageHeartrate?: number;

  @IsOptional()
  @IsBoolean()
  trainer?: boolean;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsObject()
  rawActivity?: Record<string, any>;

  @IsOptional()
  @IsObject()
  rawStreams?: Record<string, any>;
}

export class UpdateActivityDto extends CreateActivityDto {}
