import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePlanDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() tokenQuota?: number;
  @IsOptional() @IsNumber() durationDays?: number;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
