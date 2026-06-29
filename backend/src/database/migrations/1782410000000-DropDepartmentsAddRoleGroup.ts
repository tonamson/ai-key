import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropDepartmentsAddRoleGroup1782410000000 implements MigrationInterface {
  name = 'DropDepartmentsAddRoleGroup1782410000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "FK_87a8fbdcf803fd33e98a07095e0"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN IF EXISTS "departmentId"`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "group" character varying`);
    await queryRunner.query(`DROP TABLE IF EXISTS "departments"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "departments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "PK_departments" PRIMARY KEY ("id"))`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN IF EXISTS "group"`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "departmentId" uuid`);
  }
}
