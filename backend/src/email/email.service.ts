import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(config: ConfigService) {
    this.resend = new Resend(config.getOrThrow('RESEND_API_KEY'));
    this.from = config.get('RESEND_FROM') ?? 'noreply@moneynote.store';
  }

  async sendWelcome(email: string, name: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: email,
        subject: 'Chào mừng bạn đến với AI Key!',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
            <h2 style="margin:0 0 8px">Xin chào ${name}! 👋</h2>
            <p style="color:#555;margin:0 0 24px">Tài khoản của bạn đã được tạo thành công trên <strong>AI Key</strong>.</p>
            <p style="color:#555;margin:0 0 8px">Bạn có thể:</p>
            <ul style="color:#555;padding-left:20px;margin:0 0 24px">
              <li>Mua gói API Key để bắt đầu sử dụng Claude</li>
              <li>Xem hướng dẫn tích hợp với Claude Code</li>
              <li>Chia sẻ mã giới thiệu để nhận hoa hồng</li>
            </ul>
            <a href="https://moneynote.store/dashboard/buy"
               style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">
              Mua Key ngay →
            </a>
            <p style="color:#999;font-size:12px;margin:32px 0 0">AI Key · moneynote.store</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.warn(`Failed to send welcome email to ${email}: ${err}`);
    }
  }
}
