import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerify1782950000000 implements MigrationInterface {
  async up(runner: QueryRunner) {
    await runner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerifyToken" varchar`);
    await runner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT false`);
  }

  async down(runner: QueryRunner) {
    await runner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerifyToken"`);
    await runner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerified"`);
  }
}
