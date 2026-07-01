import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly siteUrl: string;
  private readonly site: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(config: ConfigService) {
    this.resend = new Resend(config.getOrThrow('RESEND_API_KEY'));
    this.siteUrl = (config.get('APP_URL') ?? 'https://cheapaikey.store').replace(/\/$/, '');
    this.site = this.siteUrl.replace(/^https?:\/\//, '');
    this.from = config.get('RESEND_FROM') ?? `noreply@${this.site}`;
  }

  private layout(content: string): string {
    const { siteUrl, site } = this;
    return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#06090F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#06090F;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px">

        <!-- Banner logo -->
        <tr><td style="padding:0 0 4px">
          <a href="${siteUrl}">
            <img src="${siteUrl}/banner.png" alt="${site}" width="540"
              style="width:100%;max-width:540px;border-radius:12px 12px 0 0;display:block" />
          </a>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#0B1F3A;border:1px solid #14485F;border-top:none;border-radius:0 0 0 0;padding:36px 32px">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#060D1A;border:1px solid #14485F;border-top:none;border-radius:0 0 12px 12px;padding:18px 32px;text-align:center">
          <p style="margin:0;color:#4D7A8A;font-size:12px">
            © 2025 <a href="${siteUrl}" style="color:#78E4E2;text-decoration:none">${site}</a> · Affordable AI API Keys
          </p>
          <p style="margin:6px 0 0;color:#2D4A5A;font-size:11px">
            Bạn nhận email này vì đã đăng ký tài khoản tại ${site}.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
  }

  private btn(url: string, text: string): string {
    return `<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#1485FF,#0B6FD4);color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:600;margin:8px 0;letter-spacing:0.2px">${text} →</a>`;
  }

  private divider(): string {
    return `<hr style="border:none;border-top:1px solid #14485F;margin:28px 0">`;
  }

  private note(text: string): string {
    return `<p style="color:#4D7A8A;font-size:12px;margin:16px 0 0">${text}</p>`;
  }

  private h2(text: string): string {
    return `<h2 style="margin:0 0 8px;font-size:22px;color:#EEF4FF;font-weight:700">${text}</h2>`;
  }

  private greeting(name: string): string {
    return `<p style="margin:0 0 24px;color:#78E4E2;font-size:14px">Xin chào <strong>${name}</strong></p>`;
  }

  private body(text: string): string {
    return `<p style="color:#8BA8B8;font-size:14px;line-height:1.7;margin:0 0 20px">${text}</p>`;
  }

  async sendSubscriptionExpiring(email: string, name: string, daysLeft: number): Promise<void> {
    const urgency = daysLeft <= 3 ? '#F4D22B' : '#78E4E2';
    const html = this.layout(`
      ${this.h2('Key của bạn sắp hết hạn')}
      ${this.greeting(name)}

      <div style="background:#0D2540;border:1px solid #14485F;border-left:4px solid ${urgency};border-radius:8px;padding:16px 20px;margin:0 0 24px">
        <p style="margin:0;font-size:14px;color:#8BA8B8">
          API Key của bạn sẽ hết hạn trong
          <strong style="color:${urgency};font-size:18px"> ${daysLeft} ngày</strong>.
        </p>
      </div>

      ${this.body('Để không bị gián đoạn dịch vụ, hãy đảm bảo số dư ví đủ để tự động gia hạn hoặc gia hạn thủ công ngay bây giờ.')}
      ${this.btn(`${this.siteUrl}/dashboard/wallet`, 'Nạp tiền ví')}
      ${this.divider()}
      ${this.note('Nếu bạn đã gia hạn, hãy bỏ qua email này.')}
    `);
    await this._send(email, `⚠️ Key sắp hết hạn trong ${daysLeft} ngày — cheapaikey.store`, html);
  }

  async sendPasswordReset(email: string, name: string, resetUrl: string): Promise<void> {
    const html = this.layout(`
      ${this.h2('Đặt lại mật khẩu')}
      ${this.greeting(name)}
      ${this.body('Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tiến hành:')}

      <div style="background:#0D2540;border:1px solid #14485F;border-radius:8px;padding:24px;margin:0 0 24px;text-align:center">
        ${this.btn(resetUrl, 'Đặt lại mật khẩu')}
        <p style="margin:12px 0 0;color:#4D7A8A;font-size:12px">Link có hiệu lực trong <strong style="color:#78E4E2">15 phút</strong></p>
      </div>

      ${this.divider()}
      ${this.note('Nếu bạn không yêu cầu điều này, hãy bỏ qua email này. Mật khẩu sẽ không thay đổi.')}
    `);
    await this._send(email, 'Đặt lại mật khẩu — cheapaikey.store', html);
  }

  async sendEmailVerify(email: string, name: string, verifyUrl: string): Promise<void> {
    const html = this.layout(`
      ${this.h2('Xác thực email của bạn')}
      ${this.greeting(name)}
      ${this.body('Chỉ còn một bước nữa! Nhấn vào nút bên dưới để xác thực địa chỉ email và kích hoạt tài khoản của bạn.')}

      <div style="background:#0D2540;border:1px solid #14485F;border-radius:8px;padding:24px;margin:0 0 24px;text-align:center">
        ${this.btn(verifyUrl, 'Xác thực email')}
        <p style="margin:12px 0 0;color:#4D7A8A;font-size:12px">Link có hiệu lực trong <strong style="color:#78E4E2">24 giờ</strong></p>
      </div>

      ${this.divider()}
      ${this.note('Nếu bạn không đăng ký tài khoản này, hãy bỏ qua email này.')}
    `);
    await this._send(email, 'Xác thực email tài khoản — cheapaikey.store', html);
  }

  async sendWelcome(email: string, name: string): Promise<void> {
    const items = [
      ['🛒', 'Mua gói API Key', 'Chọn gói phù hợp để bắt đầu'],
      ['🔧', 'Tích hợp Claude Code', 'Xem hướng dẫn tích hợp nhanh'],
      ['🎁', 'Mã giới thiệu', 'Chia sẻ để nhận hoa hồng'],
    ];
    const html = this.layout(`
      ${this.h2('Chào mừng đến với cheapaikey.store!')}
      ${this.greeting(name)}
      ${this.body('Tài khoản của bạn đã được kích hoạt thành công. Bắt đầu sử dụng API Key ngay hôm nay:')}

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
        ${items.map(([icon, title, desc]) => `
          <tr><td style="padding:0 0 8px">
            <div style="background:#0D2540;border:1px solid #14485F;border-radius:8px;padding:14px 18px">
              <span style="font-size:18px">${icon}</span>
              <strong style="font-size:14px;color:#EEF4FF;margin-left:8px">${title}</strong>
              <p style="margin:4px 0 0;font-size:12px;color:#4D7A8A;padding-left:28px">${desc}</p>
            </div>
          </td></tr>
        `).join('')}
      </table>

      ${this.btn(`${this.siteUrl}/dashboard/buy`, 'Mua Key ngay')}
      ${this.divider()}
      ${this.note(`Cần hỗ trợ? Truy cập <a href="${this.siteUrl}" style="color:#78E4E2">${this.site}</a>`)}
    `);
    await this._send(email, '🎉 Chào mừng đến với cheapaikey.store!', html);
  }

  async sendOrderConfirmed(
    email: string,
    name: string,
    opts: { planName: string; apiKey: string; expiresAt?: Date; isRenewal: boolean },
  ): Promise<void> {
    const { planName, apiKey, expiresAt, isRenewal } = opts;
    const expStr = expiresAt
      ? expiresAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : null;

    const html = this.layout(`
      ${this.h2(isRenewal ? '✅ Gia hạn thành công!' : '✅ Thanh toán thành công!')}
      ${this.greeting(name)}
      ${this.body(isRenewal
        ? `Gói <strong style="color:#78E4E2">${planName}</strong> của bạn đã được gia hạn thành công.`
        : `Gói <strong style="color:#78E4E2">${planName}</strong> đã được kích hoạt. API Key của bạn đã sẵn sàng sử dụng.`
      )}

      <div style="background:#0D2540;border:1px solid #14485F;border-radius:8px;padding:20px 24px;margin:0 0 24px">
        <p style="margin:0 0 8px;font-size:12px;color:#4D7A8A;text-transform:uppercase;letter-spacing:0.5px">API Key của bạn</p>
        <p style="margin:0;font-family:monospace;font-size:13px;color:#78E4E2;word-break:break-all;background:#060D1A;padding:10px 14px;border-radius:6px;border:1px solid #14485F">${apiKey}</p>
        ${expStr ? `<p style="margin:12px 0 0;font-size:12px;color:#4D7A8A">Hết hạn: <strong style="color:#F4D22B">${expStr}</strong></p>` : ''}
      </div>

      ${this.btn(`${this.siteUrl}/dashboard/my-keys`, 'Xem Keys của tôi')}
      ${this.divider()}
      ${this.note('Xem hướng dẫn tích hợp Claude Code tại mục Hướng dẫn trong dashboard.')}
    `);
    await this._send(email, `✅ ${isRenewal ? 'Gia hạn' : 'Thanh toán'} thành công — cheapaikey.store`, html);
  }

  private async _send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
    } catch (err) {
      this.logger.warn(`Failed to send "${subject}" to ${to}: ${err}`);
    }
  }
}
