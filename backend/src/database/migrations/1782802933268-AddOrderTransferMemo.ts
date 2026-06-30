import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderTransferMemo1782802933268 implements MigrationInterface {
    name = 'AddOrderTransferMemo1782802933268'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_userId"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_planId"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_couponId"`);
        await queryRunner.query(`ALTER TABLE "referral_codes" DROP CONSTRAINT "FK_referral_codes_userId"`);
        await queryRunner.query(`ALTER TABLE "key_subscriptions" DROP CONSTRAINT "FK_key_subscriptions_userId"`);
        await queryRunner.query(`ALTER TABLE "key_subscriptions" DROP CONSTRAINT "FK_key_subscriptions_orderId"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT "wallet_transactions_userId_fkey"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_isRead"`);
        await queryRunner.query(`DROP INDEX "public"."idx_orders_pending_expiry"`);
        await queryRunner.query(`DROP INDEX "public"."idx_token_usage_logs_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_token_usage_logs_sub_created"`);
        await queryRunner.query(`DROP INDEX "public"."idx_wallet_tx_user"`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "transferMemo" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "type"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('system', 'deal', 'reminder', 'matching')`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'system'`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "token_usage_logs" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "token_usage_logs" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "system_configs" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "system_configs" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "system_configs" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "system_configs" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE INDEX "IDX_7f1b6f5f75ad064edfec7fdae7" ON "token_usage_logs"  ("subscriptionId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_01d42af21724a6ce19c9f62880" ON "token_usage_logs"  ("createdAt") `);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_d6a21d7cc9e449f1c47a2bf9bdd" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_c26db6c65929ecfeab91073e80c" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "referral_codes" ADD CONSTRAINT "FK_e407dad46cd0f7330efdec7aac5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "key_subscriptions" ADD CONSTRAINT "FK_2c0cf6c1316a7351a3064d93197" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "key_subscriptions" ADD CONSTRAINT "FK_a829682ba455fc36b90f4027409" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "key_subscriptions" ADD CONSTRAINT "FK_a5390eb5cf0a22a82a8e3c881a5" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_69454773f1e666a14c6a9539353" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_69454773f1e666a14c6a9539353"`);
        await queryRunner.query(`ALTER TABLE "key_subscriptions" DROP CONSTRAINT "FK_a5390eb5cf0a22a82a8e3c881a5"`);
        await queryRunner.query(`ALTER TABLE "key_subscriptions" DROP CONSTRAINT "FK_a829682ba455fc36b90f4027409"`);
        await queryRunner.query(`ALTER TABLE "key_subscriptions" DROP CONSTRAINT "FK_2c0cf6c1316a7351a3064d93197"`);
        await queryRunner.query(`ALTER TABLE "referral_codes" DROP CONSTRAINT "FK_e407dad46cd0f7330efdec7aac5"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_c26db6c65929ecfeab91073e80c"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_d6a21d7cc9e449f1c47a2bf9bdd"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_01d42af21724a6ce19c9f62880"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7f1b6f5f75ad064edfec7fdae7"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "system_configs" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "system_configs" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "system_configs" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "system_configs" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "token_usage_logs" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "token_usage_logs" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "type" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "transferMemo"`);
        await queryRunner.query(`CREATE INDEX "idx_wallet_tx_user" ON "wallet_transactions" USING btree ("userId") `);
        await queryRunner.query(`CREATE INDEX "idx_token_usage_logs_sub_created" ON "token_usage_logs" USING btree ("createdAt", "subscriptionId") `);
        await queryRunner.query(`CREATE INDEX "idx_token_usage_logs_created_at" ON "token_usage_logs" USING btree ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_orders_pending_expiry" ON "orders" USING btree ("expiresAt", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_isRead" ON "notifications" USING btree ("isRead") `);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_userId" ON "notifications" USING btree ("userId") `);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "key_subscriptions" ADD CONSTRAINT "FK_key_subscriptions_orderId" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "key_subscriptions" ADD CONSTRAINT "FK_key_subscriptions_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "referral_codes" ADD CONSTRAINT "FK_referral_codes_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_couponId" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_planId" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
