import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './plan.entity';

@Injectable()
export class PlansService {
  constructor(@InjectRepository(Plan) private readonly repo: Repository<Plan>) {}

  findAll() { return this.repo.find({ order: { createdAt: 'ASC' } }); }

  findPublic() { return this.repo.find({ where: { isActive: true }, order: { createdAt: 'ASC' } }); }

  async findOne(id: string) {
    const plan = await this.repo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan không tồn tại');
    return plan;
  }

  create(dto: Partial<Plan>) { return this.repo.save(this.repo.create(dto)); }

  async update(id: string, dto: Partial<Plan>) {
    const plan = await this.findOne(id);
    Object.assign(plan, dto);
    return this.repo.save(plan);
  }

  async remove(id: string) {
    const plan = await this.findOne(id);
    plan.isActive = false;
    return this.repo.save(plan);
  }
}
