import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './notification.entity';

function makeRepo(overrides: Partial<any> = {}) {
  const saved: any[] = [];
  let idCounter = 0;

  const repo = {
    saved,
    create: jest.fn((data: any) => ({ id: `uuid-${++idCounter}`, isRead: false, createdAt: new Date(), ...data })),
    save: jest.fn(async (entity: any) => { saved.push(entity); return entity; }),
    createQueryBuilder: jest.fn(() => qb),
    ...overrides,
  };

  const rows: any[] = overrides.rows ?? [];
  const qb: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([rows, rows.length]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: rows.length }),
  };

  return { repo, qb };
}

function makeSvc(repoOverrides: Partial<any> = {}, rows: any[] = []) {
  const { repo } = makeRepo({ ...repoOverrides, rows });
  return { svc: new NotificationsService(repo as any), repo };
}

describe('NotificationsService', () => {
  describe('create()', () => {
    it('creates a notification and returns it with id', async () => {
      const { svc, repo } = makeSvc();
      const result = await svc.create({
        userId: 'user-1',
        type: NotificationType.SYSTEM,
        title: 'Test',
      });
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', title: 'Test' }));
      expect(repo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.isRead).toBe(false);
    });

    it('creates without userId (system broadcast)', async () => {
      const { svc } = makeSvc();
      const result = await svc.create({ type: NotificationType.SYSTEM, title: 'Broadcast' });
      expect(result.title).toBe('Broadcast');
    });
  });

  describe('findForUser()', () => {
    it('returns paginated notifications for a user', async () => {
      const rows = [
        { id: 'n1', userId: 'user-1', isRead: false },
        { id: 'n2', userId: 'user-1', isRead: true },
      ];
      const { svc } = makeSvc({}, rows);
      const result = await svc.findForUser('user-1', { page: 1, limit: 20 });
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });
  });

  describe('countUnread()', () => {
    it('returns unread count for user', async () => {
      const { repo } = makeRepo();
      // override createQueryBuilder for count
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3),
      };
      repo.createQueryBuilder = jest.fn().mockReturnValue(qb);
      const svc = new NotificationsService(repo as any);
      const count = await svc.countUnread('user-1');
      expect(count).toBe(3);
    });
  });

  describe('markRead()', () => {
    it('marks notification as read when owned by user', async () => {
      const notification = { id: 'n1', userId: 'user-1', isRead: false };
      const { repo } = makeRepo();
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(notification),
      };
      repo.createQueryBuilder = jest.fn().mockReturnValue(qb);
      repo.save = jest.fn().mockImplementation(async (e: any) => e);
      const svc = new NotificationsService(repo as any);
      const result = await svc.markRead('n1', 'user-1');
      expect(result.isRead).toBe(true);
    });

    it('throws NotFoundException when not owned by user', async () => {
      const { repo } = makeRepo();
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      repo.createQueryBuilder = jest.fn().mockReturnValue(qb);
      const svc = new NotificationsService(repo as any);
      await expect(svc.markRead('n-other', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('markAllRead()', () => {
    it('bulk-updates all unread notifications for user', async () => {
      const { repo } = makeRepo();
      const qb: any = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 5 }),
      };
      repo.createQueryBuilder = jest.fn().mockReturnValue(qb);
      const svc = new NotificationsService(repo as any);
      const result = await svc.markAllRead('user-1');
      expect(result.affected).toBe(5);
    });
  });
});
