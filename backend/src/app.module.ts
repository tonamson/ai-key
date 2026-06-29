import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { UploadModule } from './upload/upload.module';
import { User } from './users/user.entity';
import { Role } from './roles/role.entity';
import { ActivityLog } from './activity-log/activity-log.entity';
import { Notification } from './notifications/notification.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { NineRouterModule } from './nine-router/nine-router.module';
import { Plan } from './plans/plan.entity';
import { Coupon } from './coupons/coupon.entity';
import { ReferralCode } from './referral/referral-code.entity';
import { Order } from './orders/order.entity';
import { KeySubscription } from './subscriptions/key-subscription.entity';
import { PlansModule } from './plans/plans.module';
import { CouponsModule } from './coupons/coupons.module';
import { ReferralModule } from './referral/referral.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow('DATABASE_URL'),
        entities: [User, Role, ActivityLog, Notification, Plan, Coupon, ReferralCode, Order, KeySubscription],
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
    UploadModule,
    NotificationsModule,
    NineRouterModule,
    PlansModule,
    CouponsModule,
    ReferralModule,
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
