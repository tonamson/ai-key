import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';
import { Plan } from '../plans/plan.entity';

@Entity('key_subscriptions')
export class KeySubscription {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'userId' }) user: User;
  @Column({ type: 'uuid' }) orderId: string;
  @OneToOne(() => Order) @JoinColumn({ name: 'orderId' }) order: Order;
  @Column() nineRouterKeyId: string;
  @Column() nineRouterKey: string;
  @Column({ type: 'bigint' }) tokenQuota: number;
  @Column({ type: 'bigint', default: 0 }) tokenUsed: number;
  @Column({ type: 'bigint', default: 0 }) tokenUsedPeriod: number;
  @Column({ type: 'timestamptz' }) startsAt: Date;
  @Column({ type: 'timestamptz' }) periodStartsAt: Date;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @Column({ default: true }) isActive: boolean;
  @Column({ default: false }) autoRenew: boolean;
  @Column({ type: 'uuid', nullable: true }) planId: string | null;
  @ManyToOne(() => Plan, { nullable: true }) @JoinColumn({ name: 'planId' }) plan: Plan;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
