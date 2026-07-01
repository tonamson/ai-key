import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopupRequest } from './topup-request.entity';
import { TopupService } from './topup.service';
import { TopupController, AdminTopupController } from './topup.controller';
import { WalletModule } from '../wallet/wallet.module';
import { TelegramModule } from '../telegram/telegram.module';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TopupRequest, User]), WalletModule, TelegramModule],
  controllers: [TopupController, AdminTopupController],
  providers: [TopupService],
  exports: [TopupService],
})
export class TopupModule {}
