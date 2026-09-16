import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('queries')
@Index(['rfpId', 'status'])
@Index(['vendorId'])
@Index(['submittedAt'])
@Index(['status'])
export class Query {
  @PrimaryGeneratedColumn('uuid', { name: 'query_id' })
  queryId!: string;

  @Column({ name: 'query_number', type: 'varchar', length: 50, unique: true })
  @Index()
  queryNumber!: string;

  @Column({ name: 'rfp_id', type: 'uuid', nullable: true })
  rfpId?: string;

  @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
  vendorId?: string;

  @Column({ name: 'category_id', type: 'int', nullable: true })
  categoryId?: number;

  @Column({ name: 'clause_reference', type: 'varchar', length: 255, nullable: true })
  clauseReference?: string;

  @Column({ name: 'page_number', type: 'int', nullable: true })
  pageNumber?: number;

  @Column({ name: 'clause_title', type: 'text', nullable: true })
  clauseTitle?: string;

  @Column({ name: 'query_text', type: 'text' })
  queryText!: string;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'pending' })
  status!: string;

  @Column({ name: 'priority', type: 'varchar', length: 20, default: 'medium', nullable: true })
  priority?: string;

  @Column({ name: 'has_attachments', type: 'boolean', default: false })
  hasAttachments!: boolean;

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamp' })
  submittedAt!: Date;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'answered_at', type: 'timestamp', nullable: true })
  answeredAt?: Date;

  @Column({ name: 'submission_method', type: 'varchar', length: 50, nullable: true })
  submissionMethod?: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // AI Processing columns
  @Column({ name: 'ai_processed', type: 'boolean', default: false })
  @Index()
  aiProcessed!: boolean;

  @Column({ name: 'admin_reviewed', type: 'boolean', default: false })
  @Index()
  adminReviewed!: boolean;

  @Column({ name: 'ai_response', type: 'text', nullable: true })
  aiResponse?: string;

  @Column({ name: 'past_ref_response', type: 'text', nullable: true })
  pastRefResponse?: string;

  @Column({ name: 'past_response', type: 'text', nullable: true })
  pastResponse?: string;

  @Column({ name: 'admin_response', type: 'text', nullable: true })
  adminResponse?: string;

  @Column({ name: 'confidence', type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidence?: number;

  @Column({ name: 'source_documents', type: 'jsonb', nullable: true })
  sourceDocuments?: any;

  @Column({ name: 'execution_id', type: 'varchar', length: 100, nullable: true })
  executionId?: string;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  @Index()
  processedAt?: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt?: Date;

  // Vectorization support
  @Column({ name: 'vectorized', type: 'boolean', default: false })
  @Index()
  vectorized!: boolean;

  @Column({ name: 'vector_stored_at', type: 'timestamp', nullable: true })
  vectorStoredAt?: Date;

  // Async AI queue fields
  @Column({ name: 'ai_status', type: 'varchar', length: 32, default: 'pending' })
  aiStatus!: string; // 'pending', 'queued', 'processing', 'completed', 'failed'

  @Column({ name: 'queue_position', type: 'int', nullable: true })
  queuePosition?: number;

  @Column({ name: 'estimated_completion_time', type: 'timestamp', nullable: true })
  estimatedCompletionTime?: Date;
}
