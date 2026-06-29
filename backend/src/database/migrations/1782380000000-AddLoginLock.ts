import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoginLock1782380000000 implements MigrationInterface {
  async up(qr: QueryRunner) {
    await qr.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "loginFailCount" int NOT NULL DEFAULT 0`);
    await qr.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "loginLockUntil" timestamptz`);
  }

  async down(qr: QueryRunner) {
    await qr.query(`ALTER TABLE users DROP COLUMN IF EXISTS "loginLockUntil"`);
    await qr.query(`ALTER TABLE users DROP COLUMN IF EXISTS "loginFailCount"`);
  }
}
