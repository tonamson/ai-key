import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { DiscountType } from '../coupon.entity';

export class CreateCouponDto {
  @IsString() code: string;
  @IsEnum(DiscountType) discountType: DiscountType;
  @IsNumber() discountValue: number;
  @IsOptional() @IsNumber() maxUses?: number;
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
