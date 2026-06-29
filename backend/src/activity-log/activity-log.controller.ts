import { Controller, Get, Query } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { RequirePermission } from '../auth/decorators/roles.decorator';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';

@RequirePermission('admin:dept')
@Controller('admin/activity-logs')
export class ActivityLogController {
  constructor(private readonly service: ActivityLogService) {}

  @Get()
  findAll(@Query() query: QueryActivityLogDto) {
    return this.service.findAll(query);
  }
}
