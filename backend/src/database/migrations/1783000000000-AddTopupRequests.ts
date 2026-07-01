import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTopupRequests1783000000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`
      CREATE TABLE topup_requests (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount           NUMERIC(12,0) NOT NULL,
        memo             VARCHAR(16) NOT NULL UNIQUE,
        status           VARCHAR(16) NOT NULL DEFAULT 'pending',
        "telegramMessageId" VARCHAR(64),
        "expiresAt"      TIMESTAMPTZ NOT NULL,
        "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await q.query(`CREATE INDEX idx_topup_status ON topup_requests(status)`);
    await q.query(`CREATE INDEX idx_topup_user   ON topup_requests("userId")`);
  }

  async down(q: QueryRunner) {
    await q.query(`DROP TABLE topup_requests`);
  }
}
