import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateBikeDto {
  @IsOptional()
  @IsString()
  stravaId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  distance?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBikeDto extends CreateBikeDto {}

export class CreateEquipmentDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  weightG?: number;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;
}

import { IsDateString } from 'class-validator';

export class UpdateEquipmentDto extends CreateEquipmentDto {}
