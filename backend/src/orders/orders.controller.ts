import { Body, Controller, Get, Param, Patch, Post, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { RequirePermission } from '../auth/decorators/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.service.createOrder(req.user.id, dto);
  }

  @Get('my')
  findMine(@Request() req: any) {
    return this.service.findMine(req.user.id);
  }
}

@RequirePermission('admin:all')
@Controller('admin/orders')
export class OrdersAdminController {
  constructor(private readonly service: OrdersService) {}

  @Get() findAll() { return this.service.findAll(); }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string) { return this.service.confirmOrder(id); }
}
