import { Module } from '@nestjs/common';
import { NineRouterController, ModelsController } from './nine-router.controller';
import { NineRouterService } from './nine-router.service';

@Module({
  controllers: [NineRouterController, ModelsController],
  providers: [NineRouterService],
  exports: [NineRouterService],
})
export class NineRouterModule {}
