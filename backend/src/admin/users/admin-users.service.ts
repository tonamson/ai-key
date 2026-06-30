import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/user.entity';

@Injectable()
export class AdminUsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  async findAll(query: { search?: string; roleId?: string; isActive?: boolean; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const qb = this.repo.createQueryBuilder('user')
      .leftJoinAndSelect('user.roleDetail', 'role')
      .select(['user.id', 'user.email', 'user.name',
               'user.roleId', 'user.isActive', 'user.emailVerified', 'user.twoFactorEnabled',
               'user.createdAt', 'user.updatedAt', 'role'])
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      qb.andWhere('(user.name ILIKE :s OR user.email ILIKE :s)', { s: `%${query.search}%` });
    }
    if (query.roleId) qb.andWhere('user.roleId = :roleId', { roleId: query.roleId });
    if (query.isActive !== undefined) qb.andWhere('user.isActive = :isActive', { isActive: query.isActive });

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const user = await this.repo.findOne({
      where: { id },
      relations: { roleDetail: true },
      select: { id: true, email: true, name: true,
                roleId: true, isActive: true, emailVerified: true, twoFactorEnabled: true,
                createdAt: true, updatedAt: true },
    });
    if (!user) throw new NotFoundException('Nhân viên không tồn tại');
    return user;
  }

  async create(data: { email: string; password: string; name: string; roleId?: string }) {
    const exists = await this.repo.findOneBy({ email: data.email });
    if (exists) throw new ConflictException('Email đã tồn tại');
    const hashed = await bcrypt.hash(data.password, 10);
    const user = this.repo.create({ ...data, password: hashed });
    await this.repo.save(user);
    return this.findOne(user.id);
  }

  async update(id: string, data: { name?: string; roleId?: string; isActive?: boolean; emailVerified?: boolean }) {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('Nhân viên không tồn tại');
    Object.assign(user, data);
    // Duyệt xác thực thì xoá token đang treo để link cũ vô hiệu.
    if (data.emailVerified) user.emailVerifyToken = null;
    await this.repo.save(user);
    return this.findOne(id);
  }

  async deactivate(id: string) { return this.update(id, { isActive: false }); }
  async activate(id: string) { return this.update(id, { isActive: true }); }
  async verifyEmail(id: string) { return this.update(id, { emailVerified: true }); }
  async unverifyEmail(id: string) { return this.update(id, { emailVerified: false }); }
}
