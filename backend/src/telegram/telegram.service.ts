import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly token: string | null;
  readonly chatId: string | null;

  constructor(config: ConfigService) {
    this.token  = config.get('TELEGRAM_BOT_TOKEN') ?? null;
    this.chatId = config.get('TELEGRAM_CHAT_ID')   ?? null;
  }

  get enabled() { return !!(this.token && this.chatId); }

  async call(method: string, body: object): Promise<any> {
    if (!this.enabled) return null;
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json() as any;
      if (!json.ok) this.logger.warn(`Telegram ${method} failed: ${json.description}`);
      return json.result ?? null;
    } catch (err) {
      this.logger.warn(`Telegram ${method} error: ${err}`);
      return null;
    }
  }

  async sendMessage(text: string, opts: {
    parseMode?: 'HTML' | 'Markdown';
    inlineKeyboard?: { text: string; callback_data: string }[][];
  } = {}): Promise<string | null> {
    const body: any = {
      chat_id: this.chatId,
      text,
      parse_mode: opts.parseMode ?? 'HTML',
    };
    if (opts.inlineKeyboard) {
      body.reply_markup = { inline_keyboard: opts.inlineKeyboard };
    }
    const result = await this.call('sendMessage', body);
    return result?.message_id ? String(result.message_id) : null;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.call('deleteMessage', {
      chat_id: this.chatId,
      message_id: parseInt(messageId),
    });
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    await this.call('answerCallbackQuery', { callback_query_id: callbackQueryId, text });
  }

  /** Đăng ký webhook URL với Telegram */
  async setWebhook(url: string): Promise<void> {
    await this.call('setWebhook', { url });
  }
}
