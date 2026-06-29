import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DiscountType } from '../coupon.entity';

export class CreateCouponDto {
  @IsString() code: string;
  @IsEnum(DiscountType) discountType: DiscountType;
  @IsNumber() @Min(0) discountValue: number;
  @IsOptional() @IsNumber() @Min(1) maxUses?: number;
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
