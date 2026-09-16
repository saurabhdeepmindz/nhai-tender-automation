/**
 * NHAI Tender Query Automation System
 * Database Migration: Create Historical Documents Table
 * 
 * Purpose:
 * - Create historical_documents table for admin panel uploads
 * - Add enum types for document_type and processing_status
 * - Create indexes for performance optimization
 * - Support background processing with Bull queue
 * 
 * File: backend/src/migrations/1706000000000-CreateHistoricalDocuments.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateHistoricalDocuments1706000000000 implements MigrationInterface {
  name = 'CreateHistoricalDocuments1706000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =========================================================================
    // Step 1: Create ENUM types
    // =========================================================================

    console.log('Creating document_type_enum...');
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE document_type_enum AS ENUM ('RFP', 'Q&A', 'CORRIGENDUM');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('Creating processing_status_enum...');
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE processing_status_enum AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // =========================================================================
    // Step 2: Create historical_documents table
    // =========================================================================

    console.log('Creating historical_documents table...');
    await queryRunner.createTable(
      new Table({
        name: 'historical_documents',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'rfp_number',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'document_type',
            type: 'document_type_enum',
            isNullable: false,
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'file_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'file_size',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'file_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'processing_status_enum',
            default: "'PENDING'",
            isNullable: false,
          },
          {
            name: 'processing_metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Stores chunks_processed, vector_ids, error_message, processing_time, embedding_provider',
          },
          {
            name: 'ai_reference_count',
            type: 'integer',
            default: 0,
            isNullable: false,
            comment: 'Number of times this document was referenced by AI',
          },
          {
            name: 'extracted_content',
            type: 'text',
            isNullable: true,
            comment: 'Preview of extracted text content (first 5000 chars)',
          },
          {
            name: 'uploaded_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'processed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'uploaded_by',
            type: 'integer',
            isNullable: true,
            comment: 'User ID of admin who uploaded the document',
          },
        ],
      }),
      true,
    );

    // =========================================================================
    // Step 3: Create indexes for performance
    // =========================================================================

    console.log('Creating index on rfp_number...');
    await queryRunner.createIndex(
      'historical_documents',
      new TableIndex({
        name: 'IDX_historical_rfp_number',
        columnNames: ['rfp_number'],
      }),
    );

    console.log('Creating index on document_type...');
    await queryRunner.createIndex(
      'historical_documents',
      new TableIndex({
        name: 'IDX_historical_document_type',
        columnNames: ['document_type'],
      }),
    );

    console.log('Creating index on status...');
    await queryRunner.createIndex(
      'historical_documents',
      new TableIndex({
        name: 'IDX_historical_status',
        columnNames: ['status'],
      }),
    );

    console.log('Creating composite index on status and uploaded_at...');
    await queryRunner.createIndex(
      'historical_documents',
      new TableIndex({
        name: 'IDX_historical_status_uploaded_at',
        columnNames: ['status', 'uploaded_at'],
      }),
    );

    console.log('✅ Historical documents table created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // =========================================================================
    // Rollback: Drop table and enums
    // =========================================================================

    console.log('Rolling back: Dropping historical_documents table...');
    await queryRunner.dropTable('historical_documents', true);

    console.log('Rolling back: Dropping enum types...');
    await queryRunner.query(`
      DROP TYPE IF EXISTS document_type_enum CASCADE;
      DROP TYPE IF EXISTS processing_status_enum CASCADE;
    `);

    console.log('✅ Rollback completed');
  }
}
