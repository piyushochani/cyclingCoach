import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsNumber()
  amount: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateExpenseDto extends CreateExpenseDto {}
