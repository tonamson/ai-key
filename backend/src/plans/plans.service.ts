import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './plan.entity';
import { KeySubscription } from '../subscriptions/key-subscription.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan) private readonly repo: Repository<Plan>,
    @InjectRepository(KeySubscription) private readonly subs: Repository<KeySubscription>,
  ) {}

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
    const activeSubs = await this.subs
      .createQueryBuilder('k')
      .innerJoin('k.order', 'o')
      .where('o.planId = :id AND k.isActive = true', { id })
      .getCount();
    if (activeSubs > 0) throw new BadRequestException(`Không thể xoá gói đang có ${activeSubs} subscription active`);
    return this.repo.remove(plan);
  }
}
