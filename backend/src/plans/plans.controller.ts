import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PlansService } from './plans.service';
import { RequirePermission } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@RequirePermission('admin:all')
@Controller('admin/plans')
export class PlansAdminController {
  constructor(private readonly service: PlansService) {}

  @Get() findAll() { return this.service.findAll(); }
  @Post() create(@Body() dto: CreatePlanDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdatePlanDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}

@Public()
@Controller('plans')
export class PlansPublicController {
  constructor(private readonly service: PlansService) {}

  @Get() findPublic() { return this.service.findPublic(); }
}
