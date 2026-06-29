import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
export enum DiscountType { PERCENT = 'percent', FIXED = 'fixed' }

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) code: string;
  @Column({ type: 'enum', enum: DiscountType }) discountType: DiscountType;
  @Column({ type: 'decimal', precision: 12, scale: 2 }) discountValue: number;
  @Column({ type: 'int', nullable: true }) maxUses: number | null;
  @Column({ default: 0 }) usedCount: number;
  @Column({ type: 'timestamptz', nullable: true }) expiresAt: Date | null;
  @Column({ default: true }) isActive: boolean;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
