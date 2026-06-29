import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Coupon } from './coupon.entity';

@Injectable()
export class CouponsService {
  constructor(@InjectRepository(Coupon) private readonly repo: Repository<Coupon>) {}

  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }

  create(dto: Record<string, any>) { return this.repo.save(this.repo.create(dto as any)); }

  async update(id: string, dto: Record<string, any>) {
    const coupon = await this.repo.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon không tồn tại');
    Object.assign(coupon, dto);
    return this.repo.save(coupon);
  }

  async remove(id: string) {
    const coupon = await this.repo.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon không tồn tại');
    coupon.isActive = false;
    return this.repo.save(coupon);
  }

  /** Hoàn lại 1 lượt khi đơn bị huỷ/không confirm. */
  releaseUse(id: string) {
    return this.repo.decrement({ id }, 'usedCount', 1);
  }

  async validate(code: string): Promise<Coupon> {
    const coupon = await this.repo.findOne({ where: { code } });
    if (!coupon || !coupon.isActive) throw new BadRequestException('Mã giảm giá không hợp lệ');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException('Mã giảm giá đã hết hạn');
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    return coupon;
  }

  /**
   * Validate + giữ chỗ 1 lượt một cách atomic (conditional UPDATE chống race vượt maxUses).
   * Trả về coupon đã reserve. Phải gọi releaseUse nếu đơn không hoàn tất.
   */
  async validateAndReserve(code: string, manager?: EntityManager): Promise<Coupon> {
    const repo = manager ? manager.getRepository(Coupon) : this.repo;
    const coupon = await this.validate(code);
    // Tăng usedCount chỉ khi vẫn còn lượt (maxUses null = không giới hạn)
    const res = await repo.createQueryBuilder()
      .update(Coupon)
      .set({ usedCount: () => 'usedCount + 1' })
      .where('id = :id AND (maxUses IS NULL OR usedCount < maxUses)', { id: coupon.id })
      .execute();
    if (!res.affected) throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    coupon.usedCount += 1;
    return coupon;
  }
}
