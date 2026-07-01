import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TopupRequest, TopupStatus } from './topup-request.entity';
import { WalletService } from '../wallet/wallet.service';
import { TelegramService } from '../telegram/telegram.service';
import { User } from '../users/user.entity';

const TOPUP_TTL_MS = 30 * 60 * 1000;
const VIETQR_BASE = 'https://img.vietqr.io/image/TECHCOMBANK-19032009391010-compact.png';

@Injectable()
export class TopupService {
  private readonly appUrl: string;

  constructor(
    @InjectRepository(TopupRequest) private readonly repo: Repository<TopupRequest>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly wallet: WalletService,
    private readonly telegram: TelegramService,
    private readonly config: ConfigService,
  ) {
    this.appUrl = (config.get('APP_URL') ?? 'https://cheapaikey.store').replace(/\/$/, '');
  }

  /** Tạo đơn nạp mới, gửi Telegram */
  async create(userId: string, amount: number): Promise<TopupRequest> {
    if (amount < 10_000) throw new BadRequestException('Số tiền tối thiểu 10.000đ');

    // Huỷ pending cũ của user nếu còn (tránh spam QR)
    const oldPending = await this.repo.find({ where: { userId, status: TopupStatus.PENDING } });
    for (const old of oldPending) {
      old.status = TopupStatus.EXPIRED;
      await this.repo.save(old);
      if (old.telegramMessageId) {
        await this.telegram.deleteMessage(old.telegramMessageId).catch(() => {});
      }
    }

    const memo = this.generateMemo();
    const expiresAt = new Date(Date.now() + TOPUP_TTL_MS);
    const topup = await this.repo.save(this.repo.create({ userId, amount, memo, expiresAt }));

    const user = await this.users.findOneBy({ id: userId });
    const qrUrl = `${VIETQR_BASE}?amount=${amount}&addInfo=${memo}`;
    const fmtAmt = new Intl.NumberFormat('vi-VN').format(amount);
    const fmtExp = expiresAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const text = [
      `💰 <b>Yêu cầu nạp ví</b>`,
      ``,
      `👤 <b>User:</b> ${user?.name ?? userId} (<code>${user?.email ?? userId}</code>)`,
      `💵 <b>Số tiền:</b> ${fmtAmt}đ`,
      `🔑 <b>Mã CK:</b> <code>${memo}</code>`,
      `⏰ <b>Hết hạn:</b> ${fmtExp} (30 phút)`,
      `🆔 <b>ID đơn:</b> <code>${topup.id}</code>`,
      ``,
      `✅ Duyệt tại: ${this.appUrl}/admin/wallet`,
    ].join('\n');

    const msgId = await this.telegram.sendMessage(text);
    if (msgId) {
      topup.telegramMessageId = msgId;
      await this.repo.save(topup);
    }

    return topup;
  }

  /** Admin duyệt đơn — cộng ví + xóa/sửa message Telegram */
  async approve(topupId: string, adminNote?: string): Promise<TopupRequest> {
    const topup = await this.repo.findOne({ where: { id: topupId }, relations: { user: true } });
    if (!topup) throw new NotFoundException('Đơn nạp không tồn tại');
    if (topup.status !== TopupStatus.PENDING) throw new BadRequestException('Đơn không ở trạng thái chờ');

    topup.status = TopupStatus.APPROVED;
    await this.repo.save(topup);

    await this.wallet.adminAdjust(
      topup.userId,
      Number(topup.amount),
      `[Nạp ví] Mã ${topup.memo}${adminNote ? ' — ' + adminNote : ''}`,
    );

    if (topup.telegramMessageId) {
      const fmtAmt = new Intl.NumberFormat('vi-VN').format(Number(topup.amount));
      await this.telegram.editMessage(
        topup.telegramMessageId,
        `✅ <b>Đã duyệt nạp ví</b>\n👤 ${topup.user?.name} | 💵 ${fmtAmt}đ | 🔑 <code>${topup.memo}</code>`,
      ).catch(() => {});
    }

    return topup;
  }

  /** Admin từ chối / xóa đơn thủ công */
  async reject(topupId: string): Promise<void> {
    const topup = await this.repo.findOneBy({ id: topupId });
    if (!topup) throw new NotFoundException('Đơn nạp không tồn tại');
    topup.status = TopupStatus.EXPIRED;
    await this.repo.save(topup);
    if (topup.telegramMessageId) {
      await this.telegram.deleteMessage(topup.telegramMessageId).catch(() => {});
    }
  }

  getMyTopups(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 10 });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id }, relations: { user: true } });
  }

  findAll() {
    return this.repo.find({ relations: { user: true }, order: { createdAt: 'DESC' }, take: 100 });
  }

  /** Cron mỗi phút — expire đơn quá 30p, xóa message Telegram */
  @Cron('* * * * *')
  async expireStale(): Promise<void> {
    const expired = await this.repo.find({
      where: { status: TopupStatus.PENDING, expiresAt: LessThan(new Date()) },
    });
    for (const topup of expired) {
      topup.status = TopupStatus.EXPIRED;
      await this.repo.save(topup);
      if (topup.telegramMessageId) {
        await this.telegram.deleteMessage(topup.telegramMessageId).catch(() => {});
      }
    }
  }

  private generateMemo(): string {
    // NAP + 6 ký tự random hex — ngắn gọn, dễ phân biệt với memo của order
    return 'NAP' + Math.random().toString(16).slice(2, 8).toUpperCase();
  }
}
