import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1782390000000 implements MigrationInterface {
  async up(qr: QueryRunner) {
    await qr.query(`
      CREATE TABLE notifications (
        "id"        uuid            NOT NULL DEFAULT gen_random_uuid(),
        "userId"    uuid,
        "type"      varchar(50)     NOT NULL,
        "title"     varchar(255)    NOT NULL,
        "body"      text,
        "link"      varchar(500),
        "isRead"    boolean         NOT NULL DEFAULT false,
        "createdAt" timestamptz     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId")
          REFERENCES users("id") ON DELETE SET NULL
      )
    `);
    await qr.query(`CREATE INDEX "IDX_notifications_userId" ON notifications ("userId")`);
    await qr.query(`CREATE INDEX "IDX_notifications_isRead" ON notifications ("isRead")`);
  }

  async down(qr: QueryRunner) {
    await qr.query(`DROP TABLE IF EXISTS notifications`);
  }
}
