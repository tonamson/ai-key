import { IsJWT, IsNotEmpty, IsString, Length } from 'class-validator';

export class TwoFactorCodeDto {
  @IsString()
  @Length(6, 6, { message: 'Mã xác thực phải đúng 6 ký tự' })
  code: string;
}

export class VerifyTwoFactorDto {
  @IsJWT({ message: 'Token không hợp lệ' })
  tempToken: string;

  @IsString()
  @Length(6, 6, { message: 'Mã xác thực phải đúng 6 ký tự' })
  code: string;
}
