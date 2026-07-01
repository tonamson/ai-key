import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum TopupStatus {
  PENDING  = 'pending',
  APPROVED = 'approved',
  EXPIRED  = 'expired',
}

@Entity('topup_requests')
export class TopupRequest {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'userId' }) user: User;
  @Column({ type: 'decimal', precision: 12, scale: 0 }) amount: number;
  @Column({ type: 'varchar', length: 16, unique: true }) memo: string;
  @Column({ type: 'varchar', default: TopupStatus.PENDING }) status: TopupStatus;
  @Column({ type: 'varchar', nullable: true }) telegramMessageId: string | null;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @CreateDateColumn() createdAt: Date;
}
