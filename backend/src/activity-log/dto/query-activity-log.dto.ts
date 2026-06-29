import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ActivityAction } from '../activity-log.entity';

export class QueryActivityLogDto {
  @IsOptional()
  @IsUUID('4', { message: 'userId không hợp lệ' })
  userId?: string;

  @IsOptional()
  @IsEnum(ActivityAction, { message: 'action không hợp lệ' })
  action?: ActivityAction;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  module?: string;

  @IsOptional()
  @IsDateString({}, { message: 'from phải là ISO date' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to phải là ISO date' })
  to?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
