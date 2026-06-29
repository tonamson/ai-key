import { MigrationInterface, QueryRunner } from 'typeorm';

export class SubscriptionSchema1782420000000 implements MigrationInterface {
  name = 'SubscriptionSchema1782420000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "tokenQuota" bigint NOT NULL, "durationDays" integer NOT NULL, "price" numeric(12,0) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_plans" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TYPE "public"."coupons_discounttype_enum" AS ENUM('percent', 'fixed')`);
    await queryRunner.query(`CREATE TABLE "coupons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "discountType" "public"."coupons_discounttype_enum" NOT NULL, "discountValue" numeric(12,2) NOT NULL, "maxUses" integer, "usedCount" integer NOT NULL DEFAULT 0, "expiresAt" TIMESTAMP WITH TIME ZONE, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_coupons_code" UNIQUE ("code"), CONSTRAINT "PK_coupons" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "referral_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "code" character varying NOT NULL, "commissionPercent" numeric(5,2) NOT NULL DEFAULT '10', "totalEarned" numeric(12,0) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_referral_codes_code" UNIQUE ("code"), CONSTRAINT "PK_referral_codes" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'paid', 'cancelled')`);
    await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "planId" uuid NOT NULL, "couponId" uuid, "referralCode" character varying, "originalPrice" numeric(12,0) NOT NULL, "discountAmount" numeric(12,0) NOT NULL DEFAULT '0', "finalPrice" numeric(12,0) NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending', "paidAt" TIMESTAMP WITH TIME ZONE, "nineRouterKeyId" character varying, "nineRouterKey" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_orders" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "key_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "orderId" uuid NOT NULL, "nineRouterKeyId" character varying NOT NULL, "nineRouterKey" character varying NOT NULL, "tokenQuota" bigint NOT NULL, "tokenUsed" bigint NOT NULL DEFAULT '0', "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_key_subscriptions_orderId" UNIQUE ("orderId"), CONSTRAINT "PK_key_subscriptions" PRIMARY KEY ("id"))`);
    await queryRunner.query(`ALTER TABLE "referral_codes" ADD CONSTRAINT "FK_referral_codes_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_planId" FOREIGN KEY ("planId") REFERENCES "plans"("id")`);
    await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_couponId" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "key_subscriptions" ADD CONSTRAINT "FK_key_subscriptions_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "key_subscriptions" ADD CONSTRAINT "FK_key_subscriptions_orderId" FOREIGN KEY ("orderId") REFERENCES "orders"("id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "key_subscriptions" DROP CONSTRAINT "FK_key_subscriptions_orderId"`);
    await queryRunner.query(`ALTER TABLE "key_subscriptions" DROP CONSTRAINT "FK_key_subscriptions_userId"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_couponId"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_planId"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_userId"`);
    await queryRunner.query(`ALTER TABLE "referral_codes" DROP CONSTRAINT "FK_referral_codes_userId"`);
    await queryRunner.query(`DROP TABLE "key_subscriptions"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(`DROP TABLE "referral_codes"`);
    await queryRunner.query(`DROP TABLE "coupons"`);
    await queryRunner.query(`DROP TYPE "public"."coupons_discounttype_enum"`);
    await queryRunner.query(`DROP TABLE "plans"`);
  }
}
