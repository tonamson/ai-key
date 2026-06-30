import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const RECAPTCHA_URL = 'https://www.google.com/recaptcha/api/siteverify';
const MIN_SCORE = 0.5;

@Injectable()
export class RecaptchaService {
  private readonly secret: string;
  private readonly isProd: boolean;

  constructor(config: ConfigService) {
    this.secret = config.getOrThrow('RECAPTCHA_SECRET_KEY');
    this.isProd = config.get('NODE_ENV') === 'production';
  }

  async verify(token: string, action?: string): Promise<void> {
    if (!token) throw new BadRequestException('Thiếu reCAPTCHA token');

    // Skip in dev or if secret is placeholder
    if (!this.secret || this.secret.startsWith('your_')) return;
    if (!this.isProd) return;

    const res = await fetch(RECAPTCHA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: this.secret, response: token }).toString(),
    });

    const data: any = await res.json();

    console.log('reCAPTCHA response:', JSON.stringify(data));
    if (!data.success) throw new BadRequestException(`Xác minh reCAPTCHA thất bại: ${JSON.stringify(data['error-codes'])}`);
    if (data.score < MIN_SCORE) throw new BadRequestException(`Score quá thấp: ${data.score}`);
    if (action && data.action !== action) throw new BadRequestException(`Action không khớp: expected ${action}, got ${data.action}`);
  }
}
