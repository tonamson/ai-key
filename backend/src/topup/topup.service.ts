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
const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

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

  /** Tạo đơn nạp mới — huỷ pending cũ, gửi Telegram với inline buttons */
  async create(userId: string, amount: number): Promise<TopupRequest> {
    if (amount < 10_000) throw new BadRequestException('Số tiền tối thiểu 10.000đ');

    // Huỷ pending cũ → xóa message cũ
    const oldPending = await this.repo.find({ where: { userId, status: TopupStatus.PENDING } });
    for (const old of oldPending) {
      await this.deleteTelegramMsg(old);
      old.status = TopupStatus.EXPIRED;
      await this.repo.save(old);
    }

    const memo = this.generateMemo();
    const expiresAt = new Date(Date.now() + TOPUP_TTL_MS);
    const topup = await this.repo.save(this.repo.create({ userId, amount, memo, expiresAt }));

    const user = await this.users.findOneBy({ id: userId });
    const fmtExp = expiresAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });

    const text = [
      `💰 <b>Yêu cầu nạp ví</b>`,
      ``,
      `👤 <b>User:</b> ${user?.name ?? userId} (<code>${user?.email ?? userId}</code>)`,
      `💵 <b>Số tiền:</b> ${fmt(amount)}đ`,
      `🔑 <b>Mã CK:</b> <code>${memo}</code>`,
      `⏰ <b>Hết hạn lúc:</b> ${fmtExp}`,
    ].join('\n');

    const msgId = await this.telegram.sendMessage(text, {
      inlineKeyboard: [[
        { text: '✅ Duyệt', callback_data: `topup_approve:${topup.id}` },
        { text: '❌ Từ chối', callback_data: `topup_reject:${topup.id}` },
      ]],
    });

    // Lưu messageId tạm để cron có thể xóa khi expire
    // Sau khi duyệt/từ chối sẽ xóa message + null field này
    if (msgId) {
      topup.telegramMessageId = msgId;
      await this.repo.save(topup);
    }

    return topup;
  }

  /** Duyệt đơn — cộng ví, xóa message Telegram, null telegramMessageId */
  async approve(topupId: string, adminNote?: string): Promise<TopupRequest> {
    const topup = await this.repo.findOne({ where: { id: topupId }, relations: { user: true } });
    if (!topup) throw new NotFoundException('Đơn nạp không tồn tại');
    if (topup.status !== TopupStatus.PENDING) throw new BadRequestException('Đơn không ở trạng thái chờ');

    topup.status = TopupStatus.APPROVED;
    await this.deleteTelegramMsg(topup);  // xóa trước khi save
    await this.repo.save(topup);

    await this.wallet.adminAdjust(
      topup.userId,
      Number(topup.amount),
      `[Nạp ví] Mã ${topup.memo}${adminNote ? ' — ' + adminNote : ''}`,
    );

    return topup;
  }

  /** Từ chối — xóa message Telegram, null telegramMessageId */
  async reject(topupId: string): Promise<void> {
    const topup = await this.repo.findOneBy({ id: topupId });
    if (!topup) throw new NotFoundException('Đơn nạp không tồn tại');
    topup.status = TopupStatus.EXPIRED;
    await this.deleteTelegramMsg(topup);
    await this.repo.save(topup);
  }

  /** Xử lý callback_query từ Telegram inline button */
  async handleCallback(callbackQueryId: string, data: string): Promise<void> {
    const [action, topupId] = data.split(':');
    if (!topupId) return;

    if (action === 'topup_approve') {
      try {
        const topup = await this.approve(topupId);
        await this.telegram.answerCallbackQuery(callbackQueryId, `✅ Đã duyệt ${fmt(Number(topup.amount))}đ`);
      } catch (e: any) {
        await this.telegram.answerCallbackQuery(callbackQueryId, `❌ ${e?.message ?? 'Lỗi'}`);
      }
    } else if (action === 'topup_reject') {
      try {
        await this.reject(topupId);
        await this.telegram.answerCallbackQuery(callbackQueryId, '❌ Đã từ chối');
      } catch (e: any) {
        await this.telegram.answerCallbackQuery(callbackQueryId, `❌ ${e?.message ?? 'Lỗi'}`);
      }
    }
  }

  getMyTopups(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 10 });
  }

  findAll() {
    return this.repo.find({ relations: { user: true }, order: { createdAt: 'DESC' }, take: 100 });
  }

  /** Cron mỗi phút — expire đơn quá 30p, xóa message Telegram */
  @Cron('* * * * *')
  async expireStale(): Promise<void> {
    const stale = await this.repo.find({
      where: { status: TopupStatus.PENDING, expiresAt: LessThan(new Date()) },
    });
    for (const topup of stale) {
      await this.deleteTelegramMsg(topup);
      topup.status = TopupStatus.EXPIRED;
      await this.repo.save(topup);
    }
  }

  /** Xóa message Telegram + null telegramMessageId trong object (chưa save) */
  private async deleteTelegramMsg(topup: TopupRequest): Promise<void> {
    if (topup.telegramMessageId) {
      await this.telegram.deleteMessage(topup.telegramMessageId).catch(() => {});
      topup.telegramMessageId = null;
    }
  }

  private generateMemo(): string {
    return 'NAP' + Math.random().toString(16).slice(2, 8).toUpperCase();
  }
}
