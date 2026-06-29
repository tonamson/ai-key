import { Module } from '@nestjs/common';
import { NineRouterController } from './nine-router.controller';
import { NineRouterService } from './nine-router.service';

@Module({
  controllers: [NineRouterController],
  providers: [NineRouterService],
  exports: [NineRouterService],
})
export class NineRouterModule {}
