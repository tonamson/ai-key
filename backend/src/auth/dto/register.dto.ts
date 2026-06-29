import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  @MaxLength(64)
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Thiếu reCAPTCHA token' })
  recaptchaToken: string;

  @IsOptional()
  @IsString()
  referredBy?: string;
}
