import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('token_usage_logs')
@Index(['createdAt'])
@Index(['subscriptionId', 'createdAt'])
export class TokenUsageLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) subscriptionId: string;
  @Column({ type: 'uuid' }) userId: string;
  @Column({ type: 'int' }) inputTokens: number;
  @Column({ type: 'int' }) outputTokens: number;
  @CreateDateColumn() createdAt: Date;
}
