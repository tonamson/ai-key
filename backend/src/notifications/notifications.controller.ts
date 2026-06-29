import { Controller, Get, Param, ParseUUIDPipe, Patch, Query, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/query-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  list(@Req() req: any, @Query() query: QueryNotificationDto) {
    return this.svc.findForUser(req.user.id, query);
  }

  @Get('unread-count')
  unreadCount(@Req() req: any) {
    return this.svc.countUnread(req.user.id).then(count => ({ count }));
  }

  // read-all MUST be before :id to avoid route conflict
  @Patch('read-all')
  markAllRead(@Req() req: any) {
    return this.svc.markAllRead(req.user.id);
  }

  @Patch(':id/read')
  markRead(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.markRead(id, req.user.id);
  }
}
