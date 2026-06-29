import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum WalletTxType {
  COMMISSION = 'commission',   // hoa hồng từ F1 mua QR
  SPEND      = 'spend',        // dùng ví mua key
  REFUND     = 'refund',       // hoàn ví khi đơn bị huỷ/hết hạn
  ADMIN_ADD  = 'admin_add',    // admin nạp
  ADMIN_SUB  = 'admin_sub',    // admin trừ
}

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'userId' }) user: User;
  @Column({ type: 'decimal', precision: 12, scale: 0 }) amount: number;
  @Column({ type: 'varchar' }) type: WalletTxType;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ type: 'uuid', nullable: true }) orderId: string | null;
  @CreateDateColumn() createdAt: Date;
}
