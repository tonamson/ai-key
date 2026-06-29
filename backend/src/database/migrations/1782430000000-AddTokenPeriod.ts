import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTokenPeriod1782430000000 implements MigrationInterface {
  name = 'AddTokenPeriod1782430000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "key_subscriptions" ADD "tokenUsedPeriod" bigint NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "key_subscriptions" ADD "periodStartsAt" TIMESTAMPTZ`);
    // backfill periodStartsAt = startsAt for existing rows
    await queryRunner.query(`UPDATE "key_subscriptions" SET "periodStartsAt" = "startsAt" WHERE "periodStartsAt" IS NULL`);
    await queryRunner.query(`ALTER TABLE "key_subscriptions" ALTER COLUMN "periodStartsAt" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "key_subscriptions" DROP COLUMN "periodStartsAt"`);
    await queryRunner.query(`ALTER TABLE "key_subscriptions" DROP COLUMN "tokenUsedPeriod"`);
  }
}
