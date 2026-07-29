import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BroadcastNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsIn(['all', 'pro', 'free'])
  segment?: string = 'all';
}
