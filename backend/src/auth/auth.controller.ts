import { Body, Controller, Delete, Get, Patch, Post, Request } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RecaptchaService } from './recaptcha.service';
import { EmailService } from '../email/email.service';
import { Public } from './decorators/public.decorator';
import { RequirePermission } from './decorators/roles.decorator';
import { PERMISSION_LABELS, ROLE_KEYS, ROLE_PERMISSIONS } from './role-keys';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { TwoFactorCodeDto, VerifyTwoFactorDto } from './dto/two-factor.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly recaptcha: RecaptchaService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    await this.recaptcha.verify(dto.recaptchaToken, 'register');
    const result = await this.auth.register(dto.email, dto.password, dto.name, dto.referredBy);
    this.email.sendWelcome(dto.email, dto.name);
    return result;
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    await this.recaptcha.verify(dto.recaptchaToken, 'login');
    return this.auth.login(dto.email, dto.password);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() dto: { email: string }) {
    const result = await this.auth.forgotPassword(dto.email);
    if (result) {
      const appUrl = this.config.get('APP_URL') ?? 'https://moneynote.store';
      const resetUrl = `${appUrl}/reset-password?token=${result.token}`;
      this.email.sendPasswordReset(dto.email, result.name, resetUrl);
    }
    // Luôn trả 200 để tránh user enumeration
    return { message: 'Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu.' };
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() dto: { token: string; password: string }) {
    await this.auth.resetPassword(dto.token, dto.password);
    return { message: 'Đặt lại mật khẩu thành công' };
  }

  @Public()
  @Post('2fa/verify')
  verifyTwoFactor(@Body() dto: VerifyTwoFactorDto) {
    const payload = JSON.parse(Buffer.from(dto.tempToken.split('.')[1], 'base64').toString());
    if (!payload.twoFactorPending) throw new Error('Token không hợp lệ');
    return this.auth.verifyTwoFactor(payload.sub, dto.code);
  }

  @Get('me')
  me(@Request() req: any) {
    return req.user;
  }

  @RequirePermission('users:manage')
  @Get('role-keys')
  getRoleKeys() {
    // Trả kèm permissions của từng role để FE biết role đó có quyền gì
    return ROLE_KEYS.map(r => ({
      ...r,
      permissions: ROLE_PERMISSIONS[r.key],
    }));
  }

  @RequirePermission('roles:manage')
  @Get('permissions')
  getPermissions() {
    // Danh sách tất cả permissions kèm label/description để FE admin hiển thị khi tạo role
    return Object.entries(PERMISSION_LABELS).map(([key, meta]) => ({ key, ...meta }));
  }

  @Patch('profile')
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(req.user.id, dto);
  }

  @Post('2fa/setup')
  setupTwoFactor(@Request() req: any) {
    return this.auth.generateTwoFactorSecret(req.user.id);
  }

  @Post('2fa/enable')
  enableTwoFactor(@Request() req: any, @Body() dto: TwoFactorCodeDto) {
    return this.auth.enableTwoFactor(req.user.id, dto.code);
  }

  @Delete('2fa/disable')
  disableTwoFactor(@Request() req: any, @Body() dto: TwoFactorCodeDto) {
    return this.auth.disableTwoFactor(req.user.id, dto.code);
  }
}
