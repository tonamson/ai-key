import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordReset1782900000000 implements MigrationInterface {
  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordResetToken" varchar`);
    await qr.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordResetExpiry" timestamptz`);
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "passwordResetToken"`);
    await qr.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "passwordResetExpiry"`);
  }
}
