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

  async sendSubscriptionExpiring(email: string, name: string, daysLeft: number): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: email,
        subject: `Key của bạn sắp hết hạn trong ${daysLeft} ngày`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
            <h2 style="margin:0 0 8px">Xin chào ${name}!</h2>
            <p style="color:#555;margin:0 0 16px">API Key của bạn sẽ hết hạn trong <strong>${daysLeft} ngày</strong>.</p>
            <p style="color:#555;margin:0 0 16px">Để không bị gián đoạn dịch vụ, vui lòng đảm bảo số dư ví đủ để tự động gia hạn, hoặc gia hạn thủ công.</p>
            <a href="https://moneynote.store/dashboard/wallet"
               style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">
              Nạp tiền ví →
            </a>
            <p style="color:#999;font-size:12px;margin:32px 0 0">AI Key · moneynote.store</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.warn(`Failed to send expiring email to ${email}: ${err}`);
    }
  }

  async sendPasswordReset(email: string, name: string, resetUrl: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: email,
        subject: 'Đặt lại mật khẩu AI Key',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
            <h2 style="margin:0 0 8px">Xin chào ${name}!</h2>
            <p style="color:#555;margin:0 0 16px">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p style="color:#555;margin:0 0 24px">Nhấn vào nút bên dưới để đặt lại mật khẩu. Link có hiệu lực trong <strong>15 phút</strong>.</p>
            <a href="${resetUrl}"
               style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">
              Đặt lại mật khẩu →
            </a>
            <p style="color:#555;margin:24px 0 0;font-size:13px">Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.</p>
            <p style="color:#999;font-size:12px;margin:16px 0 0">AI Key · moneynote.store</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.warn(`Failed to send password reset email to ${email}: ${err}`);
    }
  }

  async sendEmailVerify(email: string, name: string, verifyUrl: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: email,
        subject: 'Xác thực email tài khoản AI Key',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
            <h2 style="margin:0 0 8px">Xin chào ${name}!</h2>
            <p style="color:#555;margin:0 0 16px">Nhấn vào nút bên dưới để xác thực địa chỉ email và kích hoạt tài khoản của bạn.</p>
            <a href="${verifyUrl}"
               style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">
              Xác thực email →
            </a>
            <p style="color:#555;margin:24px 0 0;font-size:13px">Nếu bạn không đăng ký tài khoản này, hãy bỏ qua email này.</p>
            <p style="color:#999;font-size:12px;margin:16px 0 0">AI Key · moneynote.store</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.warn(`Failed to send verify email to ${email}: ${err}`);
    }
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
