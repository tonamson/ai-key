import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './system-config.entity';

@Injectable()
export class SystemConfigService {
  constructor(@InjectRepository(SystemConfig) private readonly repo: Repository<SystemConfig>) {}

  findAll() { return this.repo.find({ order: { key: 'ASC' } }); }

  async get(key: string): Promise<string | null> {
    const c = await this.repo.findOne({ where: { key } });
    return c?.value ?? null;
  }

  async getNumber(key: string, fallback: number): Promise<number> {
    const v = await this.get(key);
    const n = v !== null ? Number(v) : NaN;
    return isNaN(n) ? fallback : n;
  }

  async upsert(key: string, value: string, name: string, description?: string) {
    const existing = await this.repo.findOne({ where: { key } });
    if (existing) {
      existing.value = value;
      if (name) existing.name = name;
      if (description !== undefined) existing.description = description ?? null;
      return this.repo.save(existing);
    }
    return this.repo.save(this.repo.create({ key, value, name, description: description ?? null }));
  }

  async update(id: string, value: string) {
    if (value === undefined || value === null || value.trim() === '')
      throw new BadRequestException('Giá trị config không được để trống');
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Config không tồn tại');
    c.value = value;
    return this.repo.save(c);
  }
}
