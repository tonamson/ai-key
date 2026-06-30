import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ROLE_PERMISSIONS } from '../auth/role-keys';
import { Role } from './role.entity';

@Injectable()
export class RolesService {
  constructor(@InjectRepository(Role) private readonly repo: Repository<Role>) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const role = await this.repo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role không tồn tại');
    return { ...role, permissions: ROLE_PERMISSIONS[role.key as keyof typeof ROLE_PERMISSIONS] ?? [] };
  }

  async create(data: { name: string; key: string; description?: string; group?: string }) {
    const exists = await this.repo.findOneBy({ key: data.key });
    if (exists) throw new ConflictException(`Role key "${data.key}" đã tồn tại`);
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: { name?: string; key?: string; description?: string; group?: string; isActive?: boolean }) {
    const role = await this.findOne(id);
    if (data.key && data.key !== role.key) {
      const exists = await this.repo.findOneBy({ key: data.key });
      if (exists) throw new ConflictException(`Role key "${data.key}" đã tồn tại`);
    }
    Object.assign(role, data);
    return this.repo.save(role);
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    await this.repo.remove(role);
    return { success: true };
  }
}
