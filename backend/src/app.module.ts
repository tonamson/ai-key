import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ActivityLogInterceptor } from './activity-log/activity-log.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { RolesModule } from './roles/roles.module';
import { AdminUsersModule } from './admin/users/admin-users.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { User } from './users/user.entity';
import { Role } from './roles/role.entity';
import { ActivityLog } from './activity-log/activity-log.entity';
import { Notification } from './notifications/notification.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { NineRouterModule } from './nine-router/nine-router.module';
import { EmailModule } from './email/email.module';
import { Plan } from './plans/plan.entity';
import { Coupon } from './coupons/coupon.entity';
import { ReferralCode } from './referral/referral-code.entity';
import { Order } from './orders/order.entity';
import { KeySubscription } from './subscriptions/key-subscription.entity';
import { PlansModule } from './plans/plans.module';
import { CouponsModule } from './coupons/coupons.module';
import { ReferralModule } from './referral/referral.module';
import { OrdersModule } from './orders/orders.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ClaudeProxyModule } from './claude-proxy/claude-proxy.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { WalletModule } from './wallet/wallet.module';
import { SystemConfig } from './system-config/system-config.entity';
import { WalletTransaction } from './wallet/wallet-transaction.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow('DATABASE_URL'),
        entities: [User, Role, ActivityLog, Notification, Plan, Coupon, ReferralCode, Order, KeySubscription, SystemConfig, WalletTransaction],
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: true,
        synchronize: false,
        logging: config.get('NODE_ENV') !== 'production',
      }),
    }),
    AuthModule,
    RolesModule,
    AdminUsersModule,
    ActivityLogModule,
    NotificationsModule,
    NineRouterModule,
    EmailModule,
    PlansModule,
    CouponsModule,
    ReferralModule,
    OrdersModule,
    SubscriptionsModule,
    ClaudeProxyModule,
    SystemConfigModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: ActivityLogInterceptor },
  ],
})
export class AppModule {}
