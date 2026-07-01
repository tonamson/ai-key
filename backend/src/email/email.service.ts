import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

const SITE = 'cheapaikey.store';
const SITE_URL = `https://${SITE}`;

const layout = (content: string) => `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">

        <!-- Header -->
        <tr><td style="background:#09090b;border-radius:12px 12px 0 0;padding:24px 32px">
          <a href="${SITE_URL}" style="text-decoration:none;display:flex;align-items:center;gap:8px">
            <span style="display:inline-block;width:32px;height:32px;background:#fff;border-radius:8px;text-align:center;line-height:32px;font-size:18px">⚡</span>
            <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.3px">AI Key</span>
          </a>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:36px 32px">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f4f4f5;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center">
          <p style="margin:0;color:#71717a;font-size:12px">
            © 2025 AI Key · <a href="${SITE_URL}" style="color:#71717a;text-decoration:none">${SITE}</a>
          </p>
          <p style="margin:6px 0 0;color:#a1a1aa;font-size:11px">
            Bạn nhận email này vì đã đăng ký tài khoản tại ${SITE}.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;

const btn = (url: string, text: string) =>
  `<a href="${url}" style="display:inline-block;background:#09090b;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.1px;margin:8px 0">${text} →</a>`;

const divider = () =>
  `<hr style="border:none;border-top:1px solid #f0f0f0;margin:28px 0">`;

const footer_note = (text: string) =>
  `<p style="color:#a1a1aa;font-size:12px;margin:20px 0 0">${text}</p>`;

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(config: ConfigService) {
    this.resend = new Resend(config.getOrThrow('RESEND_API_KEY'));
    this.from = config.get('RESEND_FROM') ?? `noreply@${SITE}`;
  }

  async sendSubscriptionExpiring(email: string, name: string, daysLeft: number): Promise<void> {
    const urgency = daysLeft <= 3 ? '#dc2626' : '#d97706';
    const html = layout(`
      <h2 style="margin:0 0 6px;font-size:22px;color:#09090b">Key sắp hết hạn</h2>
      <p style="margin:0 0 24px;color:#71717a;font-size:14px">Xin chào <strong style="color:#09090b">${name}</strong></p>

      <div style="background:#fafafa;border:1px solid #e4e4e7;border-left:4px solid ${urgency};border-radius:8px;padding:16px 20px;margin:0 0 24px">
        <p style="margin:0;font-size:14px;color:#3f3f46">
          API Key của bạn sẽ hết hạn trong
          <strong style="color:${urgency};font-size:16px"> ${daysLeft} ngày</strong>.
        </p>
      </div>

      <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 24px">
        Để không bị gián đoạn dịch vụ, hãy đảm bảo số dư ví đủ để tự động gia hạn hoặc gia hạn thủ công ngay bây giờ.
      </p>

      ${btn(`${SITE_URL}/dashboard/wallet`, 'Nạp tiền ví')}

      ${divider()}
      ${footer_note('Nếu bạn đã gia hạn, hãy bỏ qua email này.')}
    `);

    await this._send(email, `Key của bạn sắp hết hạn trong ${daysLeft} ngày — AI Key`, html);
  }

  async sendPasswordReset(email: string, name: string, resetUrl: string): Promise<void> {
    const html = layout(`
      <h2 style="margin:0 0 6px;font-size:22px;color:#09090b">Đặt lại mật khẩu</h2>
      <p style="margin:0 0 24px;color:#71717a;font-size:14px">Xin chào <strong style="color:#09090b">${name}</strong></p>

      <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 8px">
        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
        Nhấn vào nút bên dưới để tiến hành:
      </p>

      <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:20px 24px;margin:20px 0 24px;text-align:center">
        ${btn(resetUrl, 'Đặt lại mật khẩu')}
        <p style="margin:12px 0 0;color:#a1a1aa;font-size:12px">Link có hiệu lực trong <strong>15 phút</strong></p>
      </div>

      ${divider()}
      ${footer_note('Nếu bạn không yêu cầu điều này, hãy bỏ qua email này. Mật khẩu sẽ không thay đổi.')}
    `);

    await this._send(email, 'Đặt lại mật khẩu — AI Key', html);
  }

  async sendEmailVerify(email: string, name: string, verifyUrl: string): Promise<void> {
    const html = layout(`
      <h2 style="margin:0 0 6px;font-size:22px;color:#09090b">Xác thực email</h2>
      <p style="margin:0 0 24px;color:#71717a;font-size:14px">Xin chào <strong style="color:#09090b">${name}</strong></p>

      <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 8px">
        Chỉ còn một bước nữa! Nhấn vào nút bên dưới để xác thực địa chỉ email và kích hoạt tài khoản của bạn.
      </p>

      <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:20px 24px;margin:20px 0 24px;text-align:center">
        ${btn(verifyUrl, 'Xác thực email')}
        <p style="margin:12px 0 0;color:#a1a1aa;font-size:12px">Link có hiệu lực trong <strong>24 giờ</strong></p>
      </div>

      ${divider()}
      ${footer_note('Nếu bạn không đăng ký tài khoản này, hãy bỏ qua email này.')}
    `);

    await this._send(email, 'Xác thực email tài khoản — AI Key', html);
  }

  async sendWelcome(email: string, name: string): Promise<void> {
    const html = layout(`
      <h2 style="margin:0 0 6px;font-size:22px;color:#09090b">Chào mừng đến với AI Key!</h2>
      <p style="margin:0 0 24px;color:#71717a;font-size:14px">Xin chào <strong style="color:#09090b">${name}</strong></p>

      <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 20px">
        Tài khoản của bạn đã được kích hoạt thành công. Bắt đầu sử dụng API Key ngay hôm nay:
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
        ${[
          ['🛒', 'Mua gói API Key', 'Chọn gói phù hợp để bắt đầu'],
          ['🔧', 'Tích hợp Claude Code', 'Xem hướng dẫn tích hợp nhanh'],
          ['🎁', 'Mã giới thiệu', 'Chia sẻ để nhận hoa hồng'],
        ].map(([icon, title, desc]) => `
          <tr><td style="padding:0 0 10px">
            <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:14px 18px;display:flex;align-items:center;gap:12px">
              <span style="font-size:18px">${icon}</span>
              <div>
                <p style="margin:0;font-size:14px;font-weight:600;color:#09090b">${title}</p>
                <p style="margin:2px 0 0;font-size:12px;color:#71717a">${desc}</p>
              </div>
            </div>
          </td></tr>
        `).join('')}
      </table>

      ${btn(`${SITE_URL}/dashboard/buy`, 'Mua Key ngay')}

      ${divider()}
      ${footer_note(`Cần hỗ trợ? Liên hệ chúng tôi qua <a href="${SITE_URL}" style="color:#71717a">${SITE}</a>`)}
    `);

    await this._send(email, 'Chào mừng đến với AI Key! 🎉', html);
  }

  private async _send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
    } catch (err) {
      this.logger.warn(`Failed to send "${subject}" to ${to}: ${err}`);
    }
  }
}
