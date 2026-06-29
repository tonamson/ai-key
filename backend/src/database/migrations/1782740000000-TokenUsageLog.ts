import { MigrationInterface, QueryRunner } from 'typeorm';

export class TokenUsageLog1782740000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`
      CREATE TABLE token_usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "subscriptionId" UUID NOT NULL,
        "userId" UUID NOT NULL,
        "inputTokens" INT NOT NULL,
        "outputTokens" INT NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_token_usage_logs_created_at ON token_usage_logs ("createdAt");
      CREATE INDEX idx_token_usage_logs_sub_created ON token_usage_logs ("subscriptionId", "createdAt");
    `);
  }

  async down(q: QueryRunner) {
    await q.query(`DROP TABLE IF EXISTS token_usage_logs;`);
  }
}
