/**
 * NHAI Tender Query Automation System
 * Database Migration: Add Vectorization Support
 * 
 * Purpose:
 * - Add vectorized and vector_stored_at columns to queries table
 * - Create vectorization_logs table for tracking
 * 
 * File: backend/src/migrations/1705847291000-AddVectorizationSupport.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import { MigrationInterface, QueryRunner, TableColumn, Table, TableIndex } from 'typeorm';

export class AddVectorizationSupport1705847291000 implements MigrationInterface {
  name = 'AddVectorizationSupport1705847291000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =========================================================================
    // Step 1: Add vectorization columns to queries table
    // =========================================================================

    console.log('Adding vectorized column to queries table...');
    await queryRunner.addColumn(
      'queries',
      new TableColumn({
        name: 'vectorized',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );

    console.log('Adding vector_stored_at column to queries table...');
    await queryRunner.addColumn(
      'queries',
      new TableColumn({
        name: 'vector_stored_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Add index on vectorized column for faster queries
    console.log('Creating index on vectorized column...');
    await queryRunner.createIndex(
      'queries',
      new TableIndex({
        name: 'IDX_QUERIES_VECTORIZED',
        columnNames: ['vectorized'],
      }),
    );

    // =========================================================================
    // Step 2: Create vectorization_logs table
    // =========================================================================

    console.log('Creating vectorization_logs table...');
    await queryRunner.createTable(
      new Table({
        name: 'vectorization_logs',
        columns: [
          {
            name: 'log_id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'query_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['success', 'failed'],
            isNullable: false,
          },
          {
            name: 'duration',
            type: 'int',
            isNullable: true,
            comment: 'Duration in milliseconds',
          },
          {
            name: 'embedding_dimension',
            type: 'int',
            isNullable: true,
            comment: 'Dimension of embedding vector (e.g., 384)',
          },
          {
            name: 'processing_time',
            type: 'float',
            isNullable: true,
            comment: 'Processing time from Screen 8',
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'attempted_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Add foreign key to queries table
    console.log('Adding foreign key to queries table...');
    await queryRunner.query(
      `ALTER TABLE vectorization_logs 
       ADD CONSTRAINT FK_VECTORIZATION_LOGS_QUERY 
       FOREIGN KEY (query_id) 
       REFERENCES queries(query_id) 
       ON DELETE CASCADE`,
    );

    // Create indexes for faster queries
    console.log('Creating indexes on vectorization_logs...');
    await queryRunner.createIndex(
      'vectorization_logs',
      new TableIndex({
        name: 'IDX_VECTORIZATION_LOGS_QUERY_ID',
        columnNames: ['query_id'],
      }),
    );

    await queryRunner.createIndex(
      'vectorization_logs',
      new TableIndex({
        name: 'IDX_VECTORIZATION_LOGS_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'vectorization_logs',
      new TableIndex({
        name: 'IDX_VECTORIZATION_LOGS_QUERY_ATTEMPTED',
        columnNames: ['query_id', 'attempted_at'],
      }),
    );

    console.log('✓ Vectorization support added successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // =========================================================================
    // Rollback: Remove all changes
    // =========================================================================

    console.log('Rolling back vectorization support...');

    // Drop vectorization_logs table
    console.log('Dropping vectorization_logs table...');
    await queryRunner.dropTable('vectorization_logs', true);

    // Drop index on queries.vectorized
    console.log('Dropping index on vectorized column...');
    await queryRunner.dropIndex('queries', 'IDX_QUERIES_VECTORIZED');

    // Drop columns from queries table
    console.log('Dropping vector_stored_at column...');
    await queryRunner.dropColumn('queries', 'vector_stored_at');

    console.log('Dropping vectorized column...');
    await queryRunner.dropColumn('queries', 'vectorized');

    console.log('✓ Vectorization support rolled back successfully');
  }
}
