import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('prebid_queries')
@Index(['rfpId', 'status'])
@Index(['submittedBy'])
@Index(['submittedAt'])
@Index(['category'])
export class PrebidQuery {
  @PrimaryGeneratedColumn('uuid')
  queryId: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  queryNumber: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  rfpId: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  submittedBy: string;

  @Column({
    type: 'enum',
    enum: ['technical', 'commercial', 'eligibility', 'contractual', 'general'],
  })
  @Index()
  category: string;

  @Column({ type: 'text' })
  queryText: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments: Record<string, any>[];

  @Column({
    type: 'enum',
    enum: ['pending', 'under_review', 'answered', 'clarification_needed'],
    default: 'pending',
  })
  @Index()
  status: string;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  })
  priority: string;

  @Column({ type: 'boolean', default: false })
  @Index()
  aiProcessed: boolean;

  @Column({ type: 'boolean', default: false })
  adminReviewed: boolean;

  @CreateDateColumn()
  @Index()
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  answeredAt: Date;

  @Column({ type: 'text', nullable: true })
  aiResponse: string;

  @Column({ type: 'text', nullable: true })
  pastRefResponse: string;

  @Column({ type: 'text', nullable: true })
  pastResponse: string;

  @Column({ type: 'text', nullable: true })
  adminResponse: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidence: number;

  @Column({ type: 'text', array: true, nullable: true })
  sourceDocuments: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  executionId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  answeredBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}
