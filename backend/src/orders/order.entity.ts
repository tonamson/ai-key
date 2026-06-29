import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Plan } from '../plans/plan.entity';
import { Coupon } from '../coupons/coupon.entity';
export enum OrderStatus { PENDING = 'pending', PAID = 'paid', CANCELLED = 'cancelled' }

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'userId' }) user: User;
  @Column({ type: 'uuid' }) planId: string;
  @ManyToOne(() => Plan) @JoinColumn({ name: 'planId' }) plan: Plan;
  @Column({ type: 'uuid', nullable: true }) couponId: string | null;
  @ManyToOne(() => Coupon, { nullable: true }) @JoinColumn({ name: 'couponId' }) coupon: Coupon | null;
  @Column({ type: 'varchar', nullable: true }) referralCode: string | null;
  @Column({ type: 'decimal', precision: 12, scale: 0 }) originalPrice: number;
  @Column({ type: 'decimal', precision: 12, scale: 0, default: 0 }) discountAmount: number;
  @Column({ type: 'decimal', precision: 12, scale: 0, default: 0 }) walletUsed: number;
  @Column({ type: 'decimal', precision: 12, scale: 0 }) finalPrice: number;
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING }) status: OrderStatus;
  @Column({ type: 'timestamptz', nullable: true }) paidAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) expiresAt: Date | null;
  @Column({ type: 'uuid', nullable: true }) renewSubscriptionId: string | null;
  @Column({ type: 'varchar', nullable: true }) nineRouterKeyId: string | null;
  @Column({ type: 'varchar', nullable: true }) nineRouterKey: string | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
