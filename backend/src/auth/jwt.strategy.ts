import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../users/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
  roleKey: string | null;
  twoFactorEnabled?: boolean;
  twoFactorPending?: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // tempToken (cấp sau password, trước OTP) chỉ được dùng cho /auth/2fa/verify — không cho qua route thường.
    if (payload.twoFactorPending) throw new UnauthorizedException('Cần xác thực 2FA');

    // Token sống 7 ngày — phải re-check DB để tài khoản bị khoá/xoá không dùng được token cũ.
    const user = await this.users.findOne({
      where: { id: payload.sub },
      select: { id: true, isActive: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Tài khoản không khả dụng');

    return {
      id: payload.sub,
      email: payload.email,
      roleKey: payload.roleKey ?? null,
      twoFactorEnabled: payload.twoFactorEnabled ?? false,
    };
  }
}
