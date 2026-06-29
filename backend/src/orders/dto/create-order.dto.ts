import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID() planId: string;
  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsString() referralCode?: string;
}
