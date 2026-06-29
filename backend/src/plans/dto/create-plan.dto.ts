import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePlanDto {
  @IsString() name: string;
  @IsNumber() tokenQuota: number;
  @IsNumber() durationDays: number;
  @IsNumber() price: number;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
