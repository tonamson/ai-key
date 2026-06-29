import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderExpiryAndRenewal1782730000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    // Đơn pending tự hết hạn sau N giờ (cron dọn, nhả coupon + hoàn ví)
    await q.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "expiresAt" timestamptz NULL`);
    // Đánh dấu đơn này là gia hạn của 1 subscription sẵn có (giữ nguyên key cũ)
    await q.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "renewSubscriptionId" uuid NULL`);
    await q.query(`CREATE INDEX IF NOT EXISTS idx_orders_pending_expiry ON orders("status", "expiresAt")`);
  }

  async down(q: QueryRunner) {
    await q.query(`DROP INDEX IF EXISTS idx_orders_pending_expiry`);
    await q.query(`ALTER TABLE orders DROP COLUMN IF EXISTS "renewSubscriptionId"`);
    await q.query(`ALTER TABLE orders DROP COLUMN IF EXISTS "expiresAt"`);
  }
}
