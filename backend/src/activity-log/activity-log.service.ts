import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ActivityLog, ActivityAction } from './activity-log.entity';

@Injectable()
export class ActivityLogService {
  constructor(@InjectRepository(ActivityLog) private readonly repo: Repository<ActivityLog>) {}

  async log(data: {
    userId?: string;
    action: ActivityAction;
    module: string;
    targetId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }) {
    return this.repo.save(this.repo.create(data));
  }

  async findAll(query: {
    userId?: string;
    action?: ActivityAction;
    module?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const qb = this.repo.createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.userId) qb.andWhere('log.userId = :userId', { userId: query.userId });
    if (query.action) qb.andWhere('log.action = :action', { action: query.action });
    if (query.module) qb.andWhere('log.module = :module', { module: query.module });
    if (query.from) qb.andWhere('log.createdAt >= :from', { from: new Date(query.from) });
    if (query.to) qb.andWhere('log.createdAt <= :to', { to: new Date(query.to) });

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }
}
