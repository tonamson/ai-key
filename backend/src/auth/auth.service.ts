import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as OTPAuth from 'otpauth';
import { User } from '../users/user.entity';
import { ReferralService } from '../referral/referral.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly referral: ReferralService,
  ) {}

  private issueTokens(user: Pick<User, 'id' | 'email' | 'name' | 'roleId' | 'twoFactorEnabled'> & { roleDetail?: { key: string } | null }) {
    const roleKey = user.roleDetail?.key ?? null;
    const payload = { sub: user.id, email: user.email, roleKey, twoFactorEnabled: user.twoFactorEnabled ?? false };
    return {
      accessToken: this.jwt.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, roleKey, twoFactorEnabled: user.twoFactorEnabled ?? false },
    };
  }

  private makeTOTP(secret: string, email: string) {
    return new OTPAuth.TOTP({ issuer: 'cheapaikey.store', label: email, secret, digits: 6, period: 30 });
  }

  async register(email: string, password: string, name: string, referredBy?: string) {
    const exists = await this.users.findOneBy({ email });
    if (exists) throw new ConflictException('Email đã được sử dụng');
    const hashed = await bcrypt.hash(password, 10);
    let validRef: string | null = null;
    if (referredBy) {
      const ref = await this.referral.findByCode(referredBy.trim().toUpperCase());
      if (ref) validRef = ref.code;
    }
    const token = crypto.randomBytes(32).toString('hex');
    const saved = await this.users.save(
      this.users.create({ email, password: hashed, name, referredBy: validRef, emailVerifyToken: token, emailVerified: false }),
    );
    this.referral.generateCode(saved.id).catch(() => {});
    return { emailVerifyToken: token, name: saved.name, email: saved.email };
  }

  async verifyEmail(token: string) {
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.emailVerifyToken')
      .where('u.emailVerifyToken = :token', { token })
      .getOne();
    if (!user) throw new BadRequestException('Link xác thực không hợp lệ hoặc đã được sử dụng');
    await this.users.update(user.id, { emailVerified: true, emailVerifyToken: null });
    const updated = await this.users.findOne({ where: { id: user.id }, relations: { roleDetail: true } });
    return this.issueTokens(updated!);
  }

  async resendVerifyEmail(email: string): Promise<{ token: string; name: string } | null> {
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.emailVerifyToken')
      .where('u.email = :email', { email })
      .getOne();
    if (!user || user.emailVerified) return null;
    const token = crypto.randomBytes(32).toString('hex');
    await this.users.update(user.id, { emailVerifyToken: token });
    return { token, name: user.name };
  }

  async login(email: string, password: string) {
    const user = await this.users.findOne({ where: { email, isActive: true }, relations: { roleDetail: true } });

    // Tài khoản đang bị khóa tạm
    if (user?.loginLockUntil && user.loginLockUntil > new Date()) {
      const wait = Math.ceil((user.loginLockUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`Tài khoản tạm khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau ${wait} phút.`);
    }

    if (user && !user.emailVerified) {
      throw new UnauthorizedException('EMAIL_NOT_VERIFIED');
    }

    const passwordOk = user && (await bcrypt.compare(password, user.password));

    if (!passwordOk) {
      if (user) {
        const fails = (user.loginFailCount ?? 0) + 1;
        const locked = fails >= 3;
        await this.users.update(user.id, {
          loginFailCount: locked ? 0 : fails,
          loginLockUntil: locked ? new Date(Date.now() + 30 * 60 * 1000) : null,
        });
        if (locked) {
          throw new UnauthorizedException('Nhập sai mật khẩu 3 lần. Tài khoản bị khóa 30 phút.');
        }
      }
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Đăng nhập thành công — reset fail counter
    if (user.loginFailCount > 0 || user.loginLockUntil) {
      await this.users.update(user.id, { loginFailCount: 0, loginLockUntil: null });
    }

    if (user.twoFactorEnabled) {
      const tempToken = this.jwt.sign(
        { sub: user.id, email: user.email, roleKey: user.roleDetail?.key ?? null, twoFactorPending: true },
        { expiresIn: '5m' },
      );
      return { requiresTwoFactor: true, tempToken };
    }
    return this.issueTokens(user);
  }

  async verifyTwoFactor(userId: string, code: string) {
    const user = await this.users.findOne({
      where: { id: userId },
      select: { id: true, email: true, name: true, roleId: true, twoFactorSecret: true, twoFactorEnabled: true },
      relations: { roleDetail: true },
    });
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA chưa được kích hoạt');
    }
    const delta = this.makeTOTP(user.twoFactorSecret, user.email).validate({ token: code, window: 1 });
    if (delta === null) throw new UnauthorizedException('Mã xác thực không đúng');
    return this.issueTokens(user);
  }

  async generateTwoFactorSecret(userId: string) {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException();
    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({ issuer: 'cheapaikey.store', label: user.email, secret, digits: 6, period: 30 });
    await this.users.update(userId, { twoFactorSecret: secret.base32 });
    return { otpauthUrl: totp.toString() };
  }

  async enableTwoFactor(userId: string, code: string) {
    const user = await this.users.findOne({
      where: { id: userId },
      select: { id: true, email: true, twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!user?.twoFactorSecret) throw new UnauthorizedException('Vui lòng tạo QR trước');
    const delta = this.makeTOTP(user.twoFactorSecret, user.email).validate({ token: code, window: 1 });
    if (delta === null) throw new UnauthorizedException('Mã xác thực không đúng');
    await this.users.update(userId, { twoFactorEnabled: true });
    return { enabled: true };
  }

  async disableTwoFactor(userId: string, code: string) {
    const user = await this.users.findOne({
      where: { id: userId },
      select: { id: true, email: true, twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA chưa được kích hoạt');
    }
    const delta = this.makeTOTP(user.twoFactorSecret, user.email).validate({ token: code, window: 1 });
    if (delta === null) throw new UnauthorizedException('Mã xác thực không đúng');
    await this.users.update(userId, { twoFactorEnabled: false, twoFactorSecret: null });
    return { enabled: false };
  }

  async forgotPassword(email: string): Promise<{ token: string; name: string } | null> {
    const user = await this.users.findOneBy({ email });
    // Trả về null dù email không tồn tại để tránh user enumeration
    if (!user) return null;
    const token = crypto.randomBytes(32).toString('hex');
    await this.users.update(user.id, {
      passwordResetToken: token,
      passwordResetExpiry: new Date(Date.now() + 15 * 60 * 1000),
    });
    return { token, name: user.name };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const found = await this.users
      .createQueryBuilder('u')
      .select(['u.id', 'u.passwordResetToken', 'u.passwordResetExpiry'])
      .where('u.passwordResetToken = :token', { token })
      .andWhere('u.passwordResetExpiry > NOW()')
      .getOne();
    if (!found) throw new BadRequestException('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
    await this.users.update(found.id, {
      password: await bcrypt.hash(newPassword, 10),
      passwordResetToken: null,
      passwordResetExpiry: null,
      loginFailCount: 0,
      loginLockUntil: null,
    });
  }

  async updateProfile(id: string, data: { name?: string; currentPassword?: string; newPassword?: string }) {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new UnauthorizedException();
    if (data.name) user.name = data.name;
    if (data.newPassword) {
      if (!data.currentPassword) throw new UnauthorizedException('Vui lòng nhập mật khẩu hiện tại');
      if (!(await bcrypt.compare(data.currentPassword, user.password))) {
        throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
      }
      user.password = await bcrypt.hash(data.newPassword, 10);
    }
    await this.users.save(user);
    return { id: user.id, email: user.email, name: user.name };
  }
}
