import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString } from 'class-validator';

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
  equipmentModel?: string;

  @IsOptional()
  @IsNumber()
  weightG?: number;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;
}

export class UpdateEquipmentDto extends CreateEquipmentDto {}
