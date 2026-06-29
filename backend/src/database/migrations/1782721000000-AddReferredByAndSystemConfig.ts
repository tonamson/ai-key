import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReferredByAndSystemConfig1782721000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "referredBy" varchar NULL`);
    await q.query(`
      CREATE TABLE IF NOT EXISTS system_configs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        key varchar NOT NULL UNIQUE,
        value text NOT NULL,
        name varchar NOT NULL,
        description text NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`
      INSERT INTO system_configs (key, value, name, description) VALUES
        ('referral_commission_percent', '10', 'Hoa hồng giới thiệu (%)', 'Phần trăm hoa hồng trả cho người giới thiệu khi F1 mua hàng thành công')
      ON CONFLICT (key) DO NOTHING
    `);
  }

  async down(q: QueryRunner) {
    await q.query(`ALTER TABLE users DROP COLUMN IF EXISTS "referredBy"`);
    await q.query(`DROP TABLE IF EXISTS system_configs`);
  }
}
