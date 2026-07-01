import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderTelegramMessageId1783100000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "telegramMessageId" VARCHAR`);
  }
  async down(q: QueryRunner) {
    await q.query(`ALTER TABLE orders DROP COLUMN IF EXISTS "telegramMessageId"`);
  }
}
