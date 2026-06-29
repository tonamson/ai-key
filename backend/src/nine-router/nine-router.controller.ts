import { Body, Controller, Delete, Get, Param, Put, Post } from '@nestjs/common';
import { NineRouterService } from './nine-router.service';
import { RequirePermission } from '../auth/decorators/roles.decorator';

@RequirePermission('admin:all')
@Controller('admin/nine-router/keys')
export class NineRouterController {
  constructor(private readonly svc: NineRouterService) {}

  @Get()
  list() { return this.svc.listKeys(); }

  @Post()
  create(@Body('name') name: string) { return this.svc.createKey(name); }

  @Get(':id')
  get(@Param('id') id: string) { return this.svc.getKey(id); }

  @Put(':id')
  update(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.svc.updateKey(id, isActive);
  }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.deleteKey(id); }
}
