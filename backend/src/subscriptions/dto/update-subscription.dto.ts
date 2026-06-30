import { IsBoolean, IsDateString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsOptional() @IsNumber() @Min(0) tokenQuota?: number;
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsOptional() @IsNumber() @Min(0) tokenUsed?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() autoRenew?: boolean;
  @IsOptional() @IsUUID() planId?: string;
}
