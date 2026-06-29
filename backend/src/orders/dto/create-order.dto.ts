import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID() planId: string;
  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsBoolean() useWallet?: boolean;
  @IsOptional() @IsUUID() renewSubscriptionId?: string;
}
