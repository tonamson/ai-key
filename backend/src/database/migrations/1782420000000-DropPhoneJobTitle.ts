import { MigrationInterface, QueryRunner } from "typeorm";

export class DropPhoneJobTitle1782420000000 implements MigrationInterface {
    name = 'DropPhoneJobTitle1782420000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "phone"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "jobTitle"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "jobTitle" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying`);
    }
}
