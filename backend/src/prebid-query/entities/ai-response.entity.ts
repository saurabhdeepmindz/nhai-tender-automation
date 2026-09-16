import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PrebidQuery } from './prebid-query.entity';

@Entity('ai_responses')
@Index(['queryId'])
@Index(['createdAt'])
@Index(['responseType'])
export class AIResponse {
  @PrimaryGeneratedColumn('uuid')
  responseId!: string;

  @Column('uuid')
  @Index()
  queryId!: string;

  @ManyToOne(() => PrebidQuery, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'queryId' })
  query!: PrebidQuery;

  @Column({
    type: 'enum',
    enum: ['ai_generated', 'admin_edited', 'admin_final', 'system'],
    default: 'ai_generated',
  })
  @Index()
  responseType!: string;

  @Column({ type: 'text' })
  responseText!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidence?: number;

  @Column({ type: 'text', array: true, nullable: true })
  sourceDocuments?: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  executionId?: string;

  @Column({ type: 'int', nullable: true })
  processingTimeMs?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  generatedBy?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reviewedBy?: string;

  @Column({ type: 'boolean', default: false })
  isApproved!: boolean;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @Column({ type: 'int', default: 0 })
  version!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  parentResponseId?: string;

  @Column({ type: 'text', nullable: true })
  editNotes?: string;

  @CreateDateColumn()
  @Index()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    model?: string;
    temperature?: number;
    tokens?: number;
    historyUsed?: boolean;
    similarQueriesCount?: number;
    [key: string]: any;
  };

  @Column({ type: 'jsonb', nullable: true })
  workflowSteps?: {
    stepNumber: number;
    stepName: string;
    status: string;
    duration: number;
    output?: string;
    error?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  qualityMetrics?: {
    relevance?: number;
    completeness?: number;
    accuracy?: number;
    clarity?: number;
    overallScore?: number;
  };
}
