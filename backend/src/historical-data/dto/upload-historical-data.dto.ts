/**
 * NHAI Tender Query Automation System
 * DTOs for Historical Data Management
 * 
 * Purpose:
 * - Validation for document upload requests
 * - Response structures for API endpoints
 * - Type safety for historical document operations
 * 
 * File: backend/src/historical-data/dto/upload-historical-data.dto.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import { IsEnum, IsNotEmpty, IsString, MaxLength, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../entities/historical-document.entity';

// Define enums for upload status and data type
export enum UploadStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum HistoricalDataType {
  RFP = 'RFP',
  QA = 'Q&A',
  CORRIGENDUM = 'CORRIGENDUM',
}

export class UploadHistoricalDataDto {
  @ApiProperty({
    description: 'RFP number or unique identifier',
    example: 'RFP-2024-NH-001',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  rfp_number: string;

  @ApiProperty({
    description: 'Title or description of the document',
    example: 'Mumbai-Pune Expressway Development Project',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Type of historical document',
    enum: DocumentType,
    example: DocumentType.RFP,
  })
  @IsNotEmpty()
  @IsEnum(DocumentType)
  document_type: DocumentType;

  @ApiPropertyOptional({
    description: 'Optional description or notes about the document',
    example: 'Historical RFP for reference and AI training',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ProcessDocumentResponseDto {
  @ApiProperty({
    description: 'Success status of the operation',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Document ID in database',
    example: 123,
  })
  document_id: number;

  @ApiProperty({
    description: 'Current processing status',
    example: 'PENDING',
  })
  status: string;

  @ApiProperty({
    description: 'Status message',
    example: 'Document uploaded. Processing in background...',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Processing metadata (chunks, vectors, etc.)',
    example: { chunks_processed: 45, vector_ids: ['vec_1', 'vec_2'] },
  })
  processing_metadata?: any;
}

export class DocumentStatusResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'RFP-2024-NH-001' })
  rfp_number: string;

  @ApiProperty({ example: 'Mumbai-Pune Expressway' })
  title: string;

  @ApiProperty({ example: 'RFP' })
  document_type: string;

  @ApiProperty({ example: 'PROCESSED' })
  status: string;

  @ApiPropertyOptional()
  processing_metadata?: any;

  @ApiProperty()
  uploaded_at: Date;

  @ApiPropertyOptional()
  processed_at?: Date;

  @ApiProperty({ example: 0 })
  ai_reference_count: number;
}

export class DocumentsListResponseDto {
  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ type: [DocumentStatusResponseDto] })
  documents: DocumentStatusResponseDto[];
}

export class StatisticsResponseDto {
  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({
    example: { rfp: 45, qa: 30, corrigendum: 25 },
  })
  by_type: {
    rfp: number;
    qa: number;
    corrigendum: number;
  };

  @ApiProperty({
    example: { pending: 5, processing: 2, processed: 90, failed: 3 },
  })
  by_status: {
    pending: number;
    processing: number;
    processed: number;
    failed: number;
  };

  @ApiProperty({ example: '90.0%' })
  processing_rate: string;
}

export class BulkUploadDto {
  @ApiProperty({
    description: 'Array of historical data entries',
    type: [UploadHistoricalDataDto],
  })
  documents: UploadHistoricalDataDto[];

  @ApiPropertyOptional({
    description: 'Batch identifier for tracking',
    example: 'BATCH-2026-01-16-001',
  })
  @IsOptional()
  @IsString()
  batchId?: string;
}

export class UpdateHistoricalDataDto {
  @ApiPropertyOptional({
    description: 'Updated title',
    example: 'Mumbai-Pune Expressway Project - Updated',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated metadata',
    example: { year: 2023, region: 'Western', updated: true },
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Updated category',
    example: 'Highway Construction - Phase 2',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Updated status',
    enum: UploadStatus,
  })
  @IsOptional()
  @IsEnum(UploadStatus)
  status?: UploadStatus;
}

export class QueryHistoricalDataDto {
  @ApiPropertyOptional({
    description: 'Search text for RFP number, title, or keywords',
    example: 'Mumbai',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by type',
    enum: HistoricalDataType,
  })
  @IsOptional()
  @IsEnum(HistoricalDataType)
  type?: HistoricalDataType;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: UploadStatus,
  })
  @IsOptional()
  @IsEnum(UploadStatus)
  status?: UploadStatus;

  @ApiPropertyOptional({
    description: 'Filter by year',
    example: 2023,
  })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'uploadDate',
    default: 'uploadDate',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
/**
 * Enhanced DTOs for Step 3: Document Management
 */

export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by document type', enum: ['RFP', 'Q&A', 'CORRIGENDUM'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ['PENDING', 'PROCESSING', 'PROCESSED', 'FAILED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by RFP number', example: 'RFP-CRIS-001' })
  @IsOptional()
  @IsString()
  rfpNumber?: string;

  @ApiPropertyOptional({ description: 'Sort by field', example: 'uploaded_at', default: 'uploaded_at' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'uploaded_at';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsString()
  sortOrder?: string = 'DESC';
}

export class EnhancedDocumentDetailsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'number', example: 15 },
      rfp_number: { type: 'string', example: 'RFP-CRIS-001' },
      title: { type: 'string' },
      document_type: { type: 'string', enum: ['RFP', 'Q&A', 'CORRIGENDUM'] },
      status: { type: 'string' },
      file_details: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          size_bytes: { type: 'number' },
          size_mb: { type: 'number' },
          mime_type: { type: 'string' },
          upload_path: { type: 'string' },
        },
      },
      processing: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          started_at: { type: 'string', format: 'date-time' },
          completed_at: { type: 'string', format: 'date-time' },
          duration_seconds: { type: 'number' },
          total_chunks: { type: 'number' },
          embedding_provider: { type: 'string' },
          vector_ids_count: { type: 'number' },
        },
      },
      usage: {
        type: 'object',
        properties: {
          total_queries: { type: 'number' },
          last_query_at: { type: 'string', format: 'date-time', nullable: true },
          ai_reference_count: { type: 'number' },
        },
      },
      metadata: {
        type: 'object',
        properties: {
          extracted_content_preview: { type: 'string', nullable: true },
        },
      },
    },
  })
  document: {
    id: number;
    rfp_number: string;
    title: string;
    document_type: string;
    status: string;
    file_details: {
      name: string;
      size_bytes: number;
      size_mb: number;
      mime_type: string;
      upload_path: string;
    };
    processing: {
      status: string;
      started_at: Date;
      completed_at: Date;
      duration_seconds: number;
      total_chunks: number;
      embedding_provider: string;
      vector_ids_count: number;
    };
    usage: {
      total_queries: number;
      last_query_at: Date | null;
      ai_reference_count: number;
    };
    metadata: {
      extracted_content_preview: string | null;
    };
  };
}

export class EnhancedDocumentsListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    type: 'object',
    properties: {
      documents: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      pagination: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          limit: { type: 'number' },
          total: { type: 'number' },
          total_pages: { type: 'number' },
        },
      },
      summary: {
        type: 'object',
        properties: {
          total_documents: { type: 'number' },
          processed: { type: 'number' },
          pending: { type: 'number' },
          failed: { type: 'number' },
          total_file_size_mb: { type: 'number' },
        },
      },
    },
  })
  data: {
    documents: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
    summary: {
      total_documents: number;
      processed: number;
      pending: number;
      failed: number;
      total_file_size_mb: number;
    };
  };
}

export class DeleteDocumentResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Document deleted successfully' })
  message: string;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'number' },
      rfp_number: { type: 'string' },
      title: { type: 'string' },
      status: { type: 'string' },
    },
  })
  deleted_document: {
    id: number;
    rfp_number: string;
    title: string;
    status: string;
  };

  @ApiProperty({
    type: 'object',
    properties: {
      removed_from_chromadb: { type: 'boolean' },
      vectors_deleted: { type: 'number' },
      db_record_deleted: { type: 'boolean' },
      file_deleted: { type: 'boolean' },
      query_logs_cleaned: { type: 'number' },
      processing_time_ms: { type: 'number' },
    },
  })
  cleanup_summary: {
    removed_from_chromadb: boolean;
    vectors_deleted: number;
    db_record_deleted: boolean;
    file_deleted: boolean;
    query_logs_cleaned: number;
    processing_time_ms: number;
  };
}

export class EnhancedStatisticsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    type: 'object',
    properties: {
      documents: {
        type: 'object',
        properties: {
          total: { type: 'number' },
          by_type: { type: 'object' },
          by_status: { type: 'object' },
        },
      },
      storage: {
        type: 'object',
        properties: {
          total_size_bytes: { type: 'number' },
          total_size_mb: { type: 'number' },
          average_document_size_mb: { type: 'number' },
        },
      },
      vectorization: {
        type: 'object',
        properties: {
          total_chunks: { type: 'number' },
          total_vectors: { type: 'number' },
          embedding_provider: { type: 'string' },
          average_chunks_per_document: { type: 'number' },
        },
      },
      usage: {
        type: 'object',
        properties: {
          total_queries: { type: 'number' },
          documents_queried: { type: 'number' },
          queries_per_document_avg: { type: 'number' },
        },
      },
      processing: {
        type: 'object',
        properties: {
          total_processing_time_seconds: { type: 'number' },
          average_processing_time_seconds: { type: 'number' },
          fastest_document_seconds: { type: 'number' },
          slowest_document_seconds: { type: 'number' },
        },
      },
      last_activity: { type: 'string', format: 'date-time', nullable: true },
    },
  })
  statistics: {
    documents: {
      total: number;
      by_type: { [key: string]: number };
      by_status: { [key: string]: number };
    };
    storage: {
      total_size_bytes: number;
      total_size_mb: number;
      average_document_size_mb: number;
    };
    vectorization: {
      total_chunks: number;
      total_vectors: number;
      embedding_provider: string;
      average_chunks_per_document: number;
    };
    usage: {
      total_queries: number;
      documents_queried: number;
      queries_per_document_avg: number;
    };
    processing: {
      total_processing_time_seconds: number;
      average_processing_time_seconds: number;
      fastest_document_seconds: number;
      slowest_document_seconds: number;
    };
    last_activity: string | null;
  };
}

export class HistoricalDataFilterDto {
  @ApiPropertyOptional({ description: 'Search RFP number, title, or keywords' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by document type', enum: ['RFP', 'Q&A', 'CORRIGENDUM'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ['PENDING', 'PROCESSING', 'PROCESSED', 'FAILED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by upload year' })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort by field', example: 'uploaded_at', default: 'uploaded_at' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'uploaded_at';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsString()
  sortOrder?: string = 'DESC';
}

export class HistoricalDataListResponseDto {
  @ApiProperty({ type: [Object] })
  data: any[];

  @ApiProperty({ example: 51 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}

export class UploadHistoryItemDto {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ example: 'Mumbai-Pune Expressway Development' })
  title: string;

  @ApiProperty({ example: 'RFP - RFP-2024-NH-001' })
  description: string;

  @ApiProperty({ example: '2026-01-23T10:15:00.000Z' })
  uploadTime: Date;

  @ApiProperty({ example: 'User #1' })
  uploadedBy: string;

  @ApiProperty({ example: 1 })
  fileCount: number;

  @ApiProperty({ example: 2457600 })
  totalSize: number;

  @ApiProperty({ example: 100 })
  successRate: number;

  @ApiProperty({ example: 'SINGLE' })
  uploadType: string;
}

export class UploadHistoryResponseDto {
  @ApiProperty({ type: [UploadHistoryItemDto] })
  data: UploadHistoryItemDto[];

  @ApiProperty({ example: 54 })
  total: number;
}