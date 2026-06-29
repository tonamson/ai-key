import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { RequirePermission } from '../auth/decorators/roles.decorator';

@RequirePermission('settings:manage')
@Controller('admin/config')
export class SystemConfigController {
  constructor(private readonly svc: SystemConfigService) {}

  @Get()
  findAll() { return this.svc.findAll(); }

  @Patch(':id')
  update(@Param('id') id: string, @Body('value') value: string) {
    return this.svc.update(id, value);
  }

  @Post()
  upsert(@Body() body: { key: string; value: string; name: string; description?: string }) {
    return this.svc.upsert(body.key, body.value, body.name, body.description);
  }
}
