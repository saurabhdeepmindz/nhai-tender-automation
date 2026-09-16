/**
 * NHAI Tender Query Automation System
 * Historical Document Entity
 * 
 * Purpose:
 * - Maps to historical_documents table
 * - Stores uploaded RFP, Q&A, and Corrigendum documents
 * - Tracks processing status and vectorization metadata
 * - Used by Bull queue for background document processing
 * 
 * File: backend/src/historical-data/entities/historical-document.entity.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DocumentType {
  RFP = 'RFP',
  QA = 'Q&A',
  CORRIGENDUM = 'CORRIGENDUM',
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

@Entity('historical_documents')
@Index(['rfp_number'])
@Index(['document_type'])
@Index(['status'])
@Index(['status', 'uploaded_at'])
export class HistoricalDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  rfp_number: string;

  @Column({ length: 255 })
  title: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  document_type: DocumentType;

  @Column({ length: 500 })
  file_path: string;

  @Column({ length: 255 })
  file_name: string;

  @Column({ type: 'bigint' })
  file_size: number;

  @Column({ length: 50 })
  file_type: string;

  @Column({
    type: 'enum',
    enum: ProcessingStatus,
    default: ProcessingStatus.PENDING,
  })
  status: ProcessingStatus;

  @Column({ type: 'jsonb', nullable: true })
  processing_metadata: {
    chunks_processed?: number;
    vector_ids?: string[];
    error_message?: string;
    processing_time?: number;
    embedding_provider?: string;
  };

  @Column({ type: 'int', default: 0 })
  ai_reference_count: number;

  @Column({ type: 'text', nullable: true })
  extracted_content: string;

  @CreateDateColumn()
  uploaded_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  processed_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'int', nullable: true })
  uploaded_by: number;
}
