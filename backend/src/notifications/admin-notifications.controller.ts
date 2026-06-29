import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../auth/decorators/roles.decorator';
import { NotificationsService } from './notifications.service';
import { QueryAdminNotificationDto } from './dto/query-admin-notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';

@RequirePermission('admin:dept')
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  findAll(@Query() query: QueryAdminNotificationDto) {
    return this.svc.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.svc.create(dto);
  }
}
