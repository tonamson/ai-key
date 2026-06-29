import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';

export interface CreateNotificationDto {
  userId?: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(Notification) private readonly repo: Repository<Notification>) {}

  create(data: CreateNotificationDto) {
    return this.repo.save(this.repo.create(data));
  }

  async findForUser(userId: string, query: { isRead?: boolean; page?: number; limit?: number }) {
    const page  = query.page  ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const qb = this.repo.createQueryBuilder('n')
      .leftJoinAndSelect('n.user', 'user')
      .orderBy('n.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .andWhere('n.userId = :userId', { userId });

    if (query.isRead !== undefined) qb.andWhere('n.isRead = :isRead', { isRead: query.isRead });

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async countUnread(userId: string) {
    return this.repo.createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .andWhere('n.isRead = false')
      .getCount();
  }

  async markRead(id: string, userId: string) {
    const notification = await this.repo.createQueryBuilder('n')
      .where('n.id = :id', { id })
      .andWhere('n.userId = :userId', { userId })
      .getOne();
    if (!notification) throw new NotFoundException('Thông báo không tồn tại');
    notification.isRead = true;
    return this.repo.save(notification);
  }

  async markAllRead(userId: string) {
    return this.repo.createQueryBuilder('n')
      .update()
      .set({ isRead: true })
      .where('userId = :userId', { userId })
      .andWhere('isRead = false')
      .execute();
  }

  // Admin: view all notifications across users
  async findAll(query: {
    userId?: string;
    type?: NotificationType;
    isRead?: boolean;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const page  = query.page  ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const qb = this.repo.createQueryBuilder('n')
      .leftJoinAndSelect('n.user', 'user')
      .orderBy('n.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.userId) qb.andWhere('n.userId = :userId',  { userId: query.userId });
    if (query.type)   qb.andWhere('n.type = :type',      { type: query.type });
    if (query.isRead !== undefined) qb.andWhere('n.isRead = :isRead', { isRead: query.isRead });
    if (query.from)   qb.andWhere('n.createdAt >= :from', { from: new Date(query.from) });
    if (query.to)     qb.andWhere('n.createdAt <= :to',   { to:   new Date(query.to) });

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }
}
