import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsUUID('4', { message: 'roleId không hợp lệ' })
  roleId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
