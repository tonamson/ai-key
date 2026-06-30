import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAutoRenew1782750000000 implements MigrationInterface {
  async up(qr: QueryRunner) {
    await qr.query(`ALTER TABLE key_subscriptions ADD COLUMN IF NOT EXISTS "autoRenew" boolean NOT NULL DEFAULT false`);
    await qr.query(`ALTER TABLE key_subscriptions ADD COLUMN IF NOT EXISTS "planId" uuid`);
  }

  async down(qr: QueryRunner) {
    await qr.query(`ALTER TABLE key_subscriptions DROP COLUMN IF EXISTS "autoRenew"`);
    await qr.query(`ALTER TABLE key_subscriptions DROP COLUMN IF EXISTS "planId"`);
  }
}
