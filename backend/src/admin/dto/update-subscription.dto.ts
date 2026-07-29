import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsIn(['free', 'pro'])
  @IsNotEmpty()
  tier: string;
}
