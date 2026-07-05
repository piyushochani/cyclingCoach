import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  itemName: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  cost: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateExpenseDto extends CreateExpenseDto {}
