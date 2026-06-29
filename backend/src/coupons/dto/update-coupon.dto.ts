import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { DiscountType } from '../coupon.entity';

export class UpdateCouponDto {
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsEnum(DiscountType) discountType?: DiscountType;
  @IsOptional() @IsNumber() discountValue?: number;
  @IsOptional() @IsNumber() maxUses?: number;
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
