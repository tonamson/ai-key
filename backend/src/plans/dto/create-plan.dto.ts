import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlanDto {
  @IsString() name: string;
  @IsNumber() @Min(1) tokenQuota: number;
  @IsNumber() @Min(1) durationDays: number;
  @IsNumber() @Min(0) price: number;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
