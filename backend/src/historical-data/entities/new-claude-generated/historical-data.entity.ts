import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
// import { User } from '../../users/entities/user.entity';

export enum HistoricalDataType {
  RFP = 'RFP',
  QA = 'Q&A',
  CORRIGENDUM = 'CORRIGENDUM',
}

export enum UploadStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  ERROR = 'ERROR',
}

export enum DataSource {
  HISTORICAL = 'HISTORICAL', // Pre go-live uploads
  LIVE = 'LIVE', // Post go-live generated
}

@Entity('historical_data')
@Index(['rfpNumber'])
@Index(['type'])
@Index(['status'])
@Index(['dataSource'])
@Index(['uploadDate'])
export class HistoricalData {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  rfpNumber!: string;

  @Column({ length: 500 })
  title!: string;

  @Column({
    type: 'enum',
    enum: HistoricalDataType,
  })
  type!: HistoricalDataType;

  @Column({ length: 500, nullable: true })
  filePath?: string;

  @Column({ type: 'bigint', default: 0 })
  fileSize!: number;

  @Column({ length: 255, nullable: true })
  originalFilename?: string;

  @Column({ length: 100, nullable: true })
  mimeType?: string;

  @Column({
    type: 'enum',
    enum: UploadStatus,
    default: UploadStatus.PENDING,
  })
  status!: UploadStatus;

  @Column({
    type: 'enum',
    enum: DataSource,
    default: DataSource.HISTORICAL,
  })
  dataSource!: DataSource;

  @Column({ type: 'int', default: 0 })
  aiReferences!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  accuracyPercentage!: number;

  @CreateDateColumn()
  uploadDate!: Date;

  @UpdateDateColumn()
  lastModified!: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsed?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ length: 255, nullable: true })
  category?: string;

  @Column({ type: 'int', nullable: true })
  year?: number;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'text', nullable: true })
  processingNotes?: string;

  // Uncomment when User entity is available
  // @ManyToOne(() => User, { nullable: true })
  // @JoinColumn({ name: 'uploaded_by' })
  // uploadedBy: User;

  @Column({ type: 'int', nullable: true })
  uploaded_by?: number;

  // Vector embeddings for AI retrieval (stored as JSON for flexibility)
  @Column({ type: 'jsonb', nullable: true })
  embeddings?: any;

  // Extracted text content for search and indexing
  @Column({ type: 'text', nullable: true })
  extractedContent?: string;

  // Tags for better categorization
  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  // Related documents (e.g., RFP -> Q&A -> Corrigendum)
  @Column({ type: 'simple-array', nullable: true })
  relatedDocuments?: string[];

  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;
}
