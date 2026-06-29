import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWallet1782722000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "walletBalance" decimal(12,0) NOT NULL DEFAULT 0`);
    await q.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "walletUsed" decimal(12,0) NOT NULL DEFAULT 0`);
    await q.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount decimal(12,0) NOT NULL,
        type varchar NOT NULL,
        description text NULL,
        "orderId" uuid NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions("userId")`);
    await q.query(`
      INSERT INTO system_configs (key, value, name, description) VALUES
        ('wallet_commission_enabled', 'true', 'Bật ví hoa hồng', 'Có cộng hoa hồng vào ví khi F1 mua hàng qua QR không')
      ON CONFLICT (key) DO NOTHING
    `);
  }

  async down(q: QueryRunner) {
    await q.query(`DROP TABLE IF EXISTS wallet_transactions`);
    await q.query(`ALTER TABLE users DROP COLUMN IF EXISTS "walletBalance"`);
  }
}
