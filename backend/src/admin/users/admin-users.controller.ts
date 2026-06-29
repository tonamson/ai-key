import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { RequirePermission } from '../../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

// users:manage = super_admin + manager (theo ROLE_PERMISSIONS)
@RequirePermission('users:manage')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  findAll(@Query() query: QueryUserDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  create(@Body() dto: CreateUserDto) { return this.service.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) { return this.service.update(id, dto); }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) { return this.service.deactivate(id); }

  @Patch(':id/activate')
  activate(@Param('id') id: string) { return this.service.activate(id); }
}
