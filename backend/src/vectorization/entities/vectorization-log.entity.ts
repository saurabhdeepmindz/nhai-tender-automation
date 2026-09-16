/**
 * NHAI Tender Query Automation System
 * Vectorization Log Entity
 * 
 * Purpose:
 * - Track all vectorization attempts (success and failures)
 * - Store error messages for debugging
 * - Monitor performance metrics
 * 
 * File: backend/src/vectorization/entities/vectorization-log.entity.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('vectorization_logs')
@Index(['queryId', 'attemptedAt'])
@Index(['status'])
export class VectorizationLog {
  @PrimaryGeneratedColumn('uuid', { name: 'log_id' })
  logId!: string;

  @Column({ name: 'query_id', type: 'uuid' })
  @Index()
  queryId!: string;

  @Column({
    name: 'status',
    type: 'varchar',
  })
  status!: 'success' | 'failed';

  @Column({ name: 'duration', type: 'int', nullable: true })
  duration?: number; // Duration in milliseconds

  @Column({ name: 'embedding_dimension', type: 'int', nullable: true })
  embeddingDimension?: number; // e.g., 384 for nomic-embed-text

  @Column({ name: 'processing_time', type: 'float', nullable: true })
  processingTime?: number; // Processing time from Screen 8

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'attempted_at' })
  attemptedAt!: Date;
}
