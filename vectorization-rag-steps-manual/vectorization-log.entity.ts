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
  @PrimaryGeneratedColumn('uuid')
  logId: string;

  @Column('uuid')
  @Index()
  queryId: string;

  @Column({
    type: 'enum',
    enum: ['success', 'failed'],
  })
  status: 'success' | 'failed';

  @Column({ type: 'int', nullable: true })
  duration: number; // Duration in milliseconds

  @Column({ type: 'int', nullable: true })
  embeddingDimension: number; // e.g., 384 for nomic-embed-text

  @Column({ type: 'float', nullable: true })
  processingTime: number; // Processing time from Screen 8

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  attemptedAt: Date;
}
