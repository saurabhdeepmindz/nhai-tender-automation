import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum UploadType {
  SINGLE = 'single',
  BULK = 'bulk',
  ZIP = 'zip',
}

@Entity('upload_history')
@Index(['uploadedAt'])
@Index(['uploadedBy'])
export class UploadHistory {
  @PrimaryGeneratedColumn('uuid')
  historyId!: string;

  @Column({
    type: 'enum',
    enum: UploadType,
  })
  uploadType!: UploadType;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  uploadedBy!: string;

  @Column({ type: 'int' })
  fileCount!: number;

  @Column({ type: 'bigint' })
  totalSize!: number;

  @Column({ type: 'int', default: 0 })
  successCount!: number;

  @Column({ type: 'int', default: 0 })
  failureCount!: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'partial', 'failed'],
    default: 'pending',
  })
  status!: string;

  @CreateDateColumn()
  uploadedAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
