import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
// import { User } from '../../users/entities/user.entity';

export enum UploadType {
  SINGLE = 'SINGLE',
  BULK = 'BULK',
  AUTO = 'AUTO',
}

@Entity('upload_history')
@Index(['uploadTime'])
@Index(['uploadType'])
export class UploadHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 500 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn()
  uploadTime!: Date;

  @Column({
    type: 'enum',
    enum: UploadType,
    default: UploadType.SINGLE,
  })
  uploadType!: UploadType;

  @Column({ type: 'int', default: 1 })
  fileCount!: number;

  @Column({ type: 'bigint', default: 0 })
  totalSize!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  successRate!: number;

  @Column({ type: 'int', default: 0 })
  successCount!: number;

  @Column({ type: 'int', default: 0 })
  failureCount!: number;

  @Column({ length: 100, nullable: true })
  batchId?: string;

  // Uncomment when User entity is available
  // @ManyToOne(() => User, { nullable: true })
  // @JoinColumn({ name: 'uploaded_by' })
  // uploadedBy: User;

  @Column({ type: 'int', nullable: true })
  uploaded_by?: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Array of historical data IDs that were uploaded in this batch
  @Column({ type: 'simple-array', nullable: true })
  uploadedDocumentIds?: number[];

  @Column({ type: 'jsonb', nullable: true })
  errors?: string[];
}
