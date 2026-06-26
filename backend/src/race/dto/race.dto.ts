import { IsString, IsNumber, IsDateString, IsOptional, IsEnum } from 'class-validator';

export enum RacePriority {
  A = 'A',
  B = 'B',
  C = 'C',
}

export class CreateRaceDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsDateString()
  date: string;

  @IsString()
  location: string;

  @IsNumber()
  distance: number;

  @IsNumber()
  elevationGain: number;

  @IsEnum(RacePriority)
  priority: RacePriority;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  terrain?: string;

  @IsOptional()
  @IsString()
  story?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  completed?: boolean;
}

export class UpdateRaceDto extends CreateRaceDto {}
