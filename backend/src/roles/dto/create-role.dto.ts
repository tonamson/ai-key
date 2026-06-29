import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ROLE_KEYS } from '../../auth/role-keys';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên vai trò không được để trống' })
  @MaxLength(100)
  name: string;

  @IsString()
  @IsIn(ROLE_KEYS.map(r => r.key), { message: 'Role key không hợp lệ' })
  key: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  group?: string;
}
