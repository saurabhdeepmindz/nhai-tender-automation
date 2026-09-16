/**
 * NHAI Tender Query Automation System
 * Historical Data Service
 * 
 * Purpose:
 * - Handle document upload and database storage
 * - Queue documents for background processing with Bull
 * - Provide status tracking and statistics
 * - Support retry for failed documents
 * - Update processing status from background jobs
 * 
 * File: backend/src/historical-data/historical-data.service.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { unlinkSync } from 'fs';
import {
  HistoricalDocument,
  ProcessingStatus,
  DocumentType,
} from './entities/historical-document.entity';
import {
  UploadHistoricalDataDto,
  ProcessDocumentResponseDto,
  DocumentStatusResponseDto,
  DocumentsListResponseDto,
  StatisticsResponseDto,
  EnhancedDocumentDetailsResponseDto,
  EnhancedDocumentsListResponseDto,
  DeleteDocumentResponseDto,
  EnhancedStatisticsResponseDto,
  PaginationQueryDto,
  HistoricalDataFilterDto,
} from './dto/upload-historical-data.dto';
import { QueryDocumentResponseDto } from './dto/query-document.dto';
import { Rfp } from '../vendors/entities/rfp.entity';

@Injectable()
export class HistoricalDataService {
  private readonly logger = new Logger(HistoricalDataService.name);

  constructor(
    @InjectRepository(HistoricalDocument)
    private readonly historicalDocumentRepository: Repository<HistoricalDocument>,
    @InjectRepository(Rfp)
    private readonly rfpRepository: Repository<Rfp>,
    @InjectQueue('document-processing')
    private readonly documentProcessingQueue: Queue,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Process uploaded document
   * 1. Save metadata to PostgreSQL
   * 2. Add job to Bull queue for background processing
   */
  async processUpload(
    file: Express.Multer.File,
    uploadDto: UploadHistoricalDataDto,
  ): Promise<ProcessDocumentResponseDto> {
    try {
      this.logger.log(`Processing upload: ${file.originalname}`);

      // 1. Save to PostgreSQL
      const document = this.historicalDocumentRepository.create({
        rfp_number: uploadDto.rfp_number,
        title: uploadDto.title,
        document_type: uploadDto.document_type,
        file_path: file.path,
        file_name: file.originalname,
        file_size: file.size,
        file_type: file.mimetype,
        status: ProcessingStatus.PENDING,
      });

      const savedDocument = await this.historicalDocumentRepository.save(document);

      this.logger.log(`Document saved: ID=${savedDocument.id}`);

      // 2. Add to Bull Queue for background processing
      await this.documentProcessingQueue.add(
        'process-historical-document',
        {
          documentId: savedDocument.id,
          filePath: file.path,
          fileName: file.originalname,
          fileType: file.mimetype,
          documentType: uploadDto.document_type,
          rfpNumber: uploadDto.rfp_number,
          title: uploadDto.title,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );

      this.logger.log(`Job queued for document ID=${savedDocument.id}`);

      return {
        success: true,
        document_id: savedDocument.id,
        status: ProcessingStatus.PENDING,
        message: 'Document uploaded. Processing in background...',
      };
    } catch (error) {
      this.logger.error(`Upload error: ${error.message}`, error.stack);
      throw new HttpException(
        `Upload failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get document status by ID
   */
  async getDocumentStatus(id: number): Promise<DocumentStatusResponseDto> {
    const document = await this.historicalDocumentRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    return {
      id: document.id,
      rfp_number: document.rfp_number,
      title: document.title,
      document_type: document.document_type,
      status: document.status,
      processing_metadata: document.processing_metadata,
      uploaded_at: document.uploaded_at,
      processed_at: document.processed_at,
      ai_reference_count: document.ai_reference_count,
    };
  }

  /**
   * Get all documents with optional filters
   */
  async getAllDocuments(filters?: {
    type?: string;
    status?: string;
    rfpNumber?: string;
  }): Promise<DocumentsListResponseDto> {
    const where: any = {};

    if (filters?.type) where.document_type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.rfpNumber) where.rfp_number = filters.rfpNumber;

    const documents = await this.historicalDocumentRepository.find({
      where,
      order: { uploaded_at: 'DESC' },
    });

    return {
      total: documents.length,
      documents: documents.map(doc => ({
        id: doc.id,
        rfp_number: doc.rfp_number,
        title: doc.title,
        document_type: doc.document_type,
        status: doc.status,
        processing_metadata: doc.processing_metadata,
        uploaded_at: doc.uploaded_at,
        processed_at: doc.processed_at,
        ai_reference_count: doc.ai_reference_count,
      })),
    };
  }

  /**
   * Get statistics summary
   */
  async getStatistics(): Promise<StatisticsResponseDto> {
    const [
      total,
      rfpCount,
      qaCount,
      corrigendumCount,
      pending,
      processing,
      processed,
      failed,
    ] = await Promise.all([
      this.historicalDocumentRepository.count(),
      this.historicalDocumentRepository.count({
        where: { document_type: DocumentType.RFP },
      }),
      this.historicalDocumentRepository.count({
        where: { document_type: DocumentType.QA },
      }),
      this.historicalDocumentRepository.count({
        where: { document_type: DocumentType.CORRIGENDUM },
      }),
      this.historicalDocumentRepository.count({
        where: { status: ProcessingStatus.PENDING },
      }),
      this.historicalDocumentRepository.count({
        where: { status: ProcessingStatus.PROCESSING },
      }),
      this.historicalDocumentRepository.count({
        where: { status: ProcessingStatus.PROCESSED },
      }),
      this.historicalDocumentRepository.count({
        where: { status: ProcessingStatus.FAILED },
      }),
    ]);

    return {
      total,
      by_type: { rfp: rfpCount, qa: qaCount, corrigendum: corrigendumCount },
      by_status: { pending, processing, processed, failed },
      processing_rate: total > 0 ? `${((processed / total) * 100).toFixed(1)}%` : '0%',
    };
  }

  /**
   * Update document processing status
   * Called by background job processor
   */
  async updateDocumentStatus(
    documentId: number,
    status: ProcessingStatus,
    processingMetadata?: any,
    extractedContent?: string,
  ): Promise<void> {
    await this.historicalDocumentRepository.update(documentId, {
      status,
      processing_metadata: processingMetadata,
      extracted_content: extractedContent,
      processed_at: status === ProcessingStatus.PROCESSED ? new Date() : null,
    });

    this.logger.log(`Document ${documentId} status updated: ${status}`);
  }

  /**
   * Retry failed document processing
   */
  async retryProcessing(id: number) {
    const document = await this.historicalDocumentRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    if (document.status !== ProcessingStatus.FAILED) {
      throw new HttpException(
        'Only failed documents can be retried',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Reset status
    await this.historicalDocumentRepository.update(id, {
      status: ProcessingStatus.PENDING,
      processing_metadata: null,
    });

    // Requeue
    await this.documentProcessingQueue.add(
      'process-historical-document',
      {
        documentId: document.id,
        filePath: document.file_path,
        fileName: document.file_name,
        fileType: document.file_type,
        documentType: document.document_type,
        rfpNumber: document.rfp_number,
        title: document.title,
      },
    );

    this.logger.log(`Document ${id} requeued for processing`);

    return {
      success: true,
      message: 'Document requeued for processing',
      document_id: id,
    };
  }

  /**
   * Query a processed document with a question
   * Calls Python RAG service to get answer with sources
   */
  async queryDocument(
    documentId: number,
    question: string,
  ): Promise<QueryDocumentResponseDto> {
    // 1. Get document from database
    const document = await this.historicalDocumentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    // 2. Verify document is processed
    if (document.status !== ProcessingStatus.PROCESSED) {
      throw new HttpException(
        `Document is not yet processed. Current status: ${document.status}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3. Call Python RAG service
    const pythonServiceUrl = this.configService.get<string>(
      'PYTHON_RAG_SERVICE_URL',
      'http://localhost:8005',
    );

    try {
      this.logger.log(
        `Querying document ${documentId} via Python service: ${question.substring(0, 50)}...`,
      );

      const response = await firstValueFrom(
        this.httpService.post(`${pythonServiceUrl}/api/query-document`, {
          document_id: documentId,
          question: question,
          document_type: document.document_type,
          rfp_number: document.rfp_number,
        }),
      );

      this.logger.log(
        `Query successful for document ${documentId}, answer length: ${response.data.answer?.length || 0}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error querying document ${documentId}: ${error.message}`,
        error.stack,
      );

      if (error.code === 'ECONNREFUSED') {
        throw new HttpException(
          `Cannot connect to Python RAG service at ${pythonServiceUrl}. Is the service running on port 8005?`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (error.response) {
        throw new HttpException(
          error.response.data?.detail || 'Python service error',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException(
        'Failed to query document',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all documents with enhanced pagination, sorting, and filtering
   */
  async getAllDocumentsEnhanced(
    paginationDto: PaginationQueryDto,
  ): Promise<EnhancedDocumentsListResponseDto> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = paginationDto.sortBy || 'uploaded_at';
    const sortOrder = paginationDto.sortOrder || 'DESC';

    // Build query
    let query = this.historicalDocumentRepository.createQueryBuilder('doc');

    // Apply filters
    if (paginationDto.status) {
      query = query.where('doc.status = :status', { status: paginationDto.status });
    }

    if (paginationDto.type) {
      query = query.andWhere('doc.document_type = :type', {
        type: paginationDto.type,
      });
    }

    if (paginationDto.rfpNumber) {
      query = query.andWhere('doc.rfp_number ILIKE :rfpNumber', {
        rfpNumber: `%${paginationDto.rfpNumber}%`,
      });
    }

    // Get total count
    const total = await query.getCount();

    // Apply sorting and pagination
    const documents = await query
      .orderBy(`doc.${sortBy}`, sortOrder as 'ASC' | 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    // Build summary stats
    const processedCount = documents.filter(doc => doc.status === ProcessingStatus.PROCESSED).length;
    const pendingCount = documents.filter(doc => doc.status === ProcessingStatus.PENDING).length;
    const failedCount = documents.filter(doc => doc.status === ProcessingStatus.FAILED).length;

    return {
      success: true,
      data: {
        documents: documents.map(doc => ({
          id: doc.id,
          rfp_number: doc.rfp_number,
          title: doc.title,
          document_type: doc.document_type,
          file_name: doc.file_name,
          file_size: doc.file_size,
          status: doc.status,
          uploaded_at: doc.uploaded_at,
          updated_at: doc.updated_at,
        })),
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
        summary: {
          total_documents: total,
          processed: processedCount,
          pending: pendingCount,
          failed: failedCount,
          total_file_size_mb: Math.round(
            documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0) / 1024 / 1024
          ),
        },
      },
    };
  }

  /**
   * Get documents belonging to closed/awarded RFPs (or documents whose RFP
   * cannot be identified at all — no active bid means "not live").
   */
  async getHistoricalData(filters: HistoricalDataFilterDto) {
    return this.getDocumentsByLiveness(filters, false);
  }

  /**
   * Get documents belonging to RFPs that are still open for bidding.
   */
  async getLiveData(filters: HistoricalDataFilterDto) {
    return this.getDocumentsByLiveness(filters, true);
  }

  /**
   * "Live" vs "Historical" is derived from the linked RFP's status/deadline
   * (rfps.rfp_number = historical_documents.rfp_number) — there is no
   * dedicated column for this on historical_documents. A document whose
   * rfp_number does not match any row in rfps is treated as historical,
   * since it has no currently-open bid associated with it.
   */
  private async getDocumentsByLiveness(filters: HistoricalDataFilterDto, isLive: boolean) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = filters.sortBy || 'uploaded_at';
    const sortOrder: 'ASC' | 'DESC' = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const liveExpression =
      "CASE WHEN LOWER(rfp.status) = 'published' AND rfp.bid_submission_deadline >= :today THEN true ELSE false END";

    let query = this.historicalDocumentRepository
      .createQueryBuilder('doc')
      .leftJoin(Rfp, 'rfp', 'rfp.rfp_number = doc.rfp_number')
      .where(`${liveExpression} = :isLive`, { today: new Date(), isLive });

    if (filters.search) {
      query = query.andWhere('(doc.title ILIKE :search OR doc.rfp_number ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }
    if (filters.type) {
      query = query.andWhere('doc.document_type = :type', { type: filters.type });
    }
    if (filters.status) {
      query = query.andWhere('doc.status = :status', { status: filters.status });
    }
    if (filters.year) {
      query = query.andWhere('EXTRACT(YEAR FROM doc.uploaded_at) = :year', { year: filters.year });
    }

    const total = await query.getCount();

    const documents = await query
      .orderBy(`doc.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      data: documents.map((doc) => ({
        id: doc.id,
        rfpNumber: doc.rfp_number,
        title: doc.title,
        type: doc.document_type,
        filePath: doc.file_path,
        fileSize: doc.file_size,
        originalFilename: doc.file_name,
        mimeType: doc.file_type,
        status: doc.status,
        aiReferences: doc.ai_reference_count,
        accuracyPercentage: 0,
        uploadDate: doc.uploaded_at,
        lastUsed: null,
        metadata: doc.processing_metadata,
        uploadedBy: doc.uploaded_by,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get upload history — one entry per uploaded document, most recent first.
   * There is no separate batch-upload record in the schema, so each document
   * upload is reported as its own history entry (fileCount is always 1).
   */
  async getUploadHistory(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [documents, total] = await this.historicalDocumentRepository
      .createQueryBuilder('doc')
      .orderBy('doc.uploaded_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        description: `${doc.document_type} - RFP ${doc.rfp_number}`,
        uploadTime: doc.uploaded_at,
        uploadedBy: doc.uploaded_by ? `User #${doc.uploaded_by}` : 'Unknown',
        fileCount: 1,
        totalSize: doc.file_size,
        successRate: doc.status === ProcessingStatus.PROCESSED ? 100 : 0,
        uploadType: 'SINGLE',
      })),
      total,
    };
  }

  /**
   * Get detailed document information with statistics
   */
  async getDocumentStatusEnhanced(
    id: number,
  ): Promise<EnhancedDocumentDetailsResponseDto> {
    const document = await this.historicalDocumentRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    // Get vector count from metadata
    const vectorCount = document.processing_metadata?.vector_ids?.length || 0;

    // Calculate processing time
    const processingTime = document.processed_at && document.uploaded_at
      ? new Date(document.processed_at).getTime() -
        new Date(document.uploaded_at).getTime()
      : null;

    return {
      success: true,
      document: {
        id: document.id,
        rfp_number: document.rfp_number,
        title: document.title,
        document_type: document.document_type,
        status: document.status,
        file_details: {
          name: document.file_name,
          size_bytes: document.file_size,
          size_mb: Math.round(document.file_size / 1024 / 1024 * 100) / 100,
          mime_type: document.file_type,
          upload_path: document.file_path,
        },
        processing: {
          status: document.status,
          started_at: document.uploaded_at,
          completed_at: document.processed_at,
          duration_seconds: processingTime ? Math.round(processingTime / 1000) : 0,
          total_chunks: vectorCount,
          embedding_provider: document.processing_metadata?.embedding_provider || 'ollama',
          vector_ids_count: vectorCount,
        },
        usage: {
          total_queries: 0,
          last_query_at: null,
          ai_reference_count: document.ai_reference_count || 0,
        },
        metadata: {
          extracted_content_preview: document.extracted_content?.substring(0, 500) || null,
        },
      },
    };
  }

  /**
   * Get enhanced statistics across all documents
   */
  async getStatisticsEnhanced(): Promise<EnhancedStatisticsResponseDto> {
    const allDocuments = await this.historicalDocumentRepository.find();

    let totalFileSize = 0;
    let totalVectors = 0;
    let totalProcessingTime = 0;
    let processedDocuments = 0;
    const documentTypes: { [key: string]: number } = {};

    let pendingCount = 0;
    let processingCount = 0;
    let successCount = 0;
    let failureCount = 0;

    for (const doc of allDocuments) {
      totalFileSize += doc.file_size || 0;
      totalVectors += doc.processing_metadata?.vector_ids?.length || 0;

      // Count by status
      switch (doc.status) {
        case ProcessingStatus.PROCESSING:
          processingCount++;
          break;
        case ProcessingStatus.PROCESSED:
          successCount++;
          if (doc.processed_at && doc.uploaded_at) {
            totalProcessingTime +=
              new Date(doc.processed_at).getTime() -
              new Date(doc.uploaded_at).getTime();
            processedDocuments++;
          }
          break;
        case ProcessingStatus.FAILED:
          failureCount++;
          break;
        case ProcessingStatus.PENDING:
          pendingCount++;
          break;
      }

      // Count by type
      if (doc.document_type) {
        documentTypes[doc.document_type] =
          (documentTypes[doc.document_type] || 0) + 1;
      }
    }

    const totalDocuments = allDocuments.length;
    const avgProcessingTime = processedDocuments > 0
      ? Math.round(totalProcessingTime / processedDocuments)
      : 0;

    return {
      success: true,
      statistics: {
        documents: {
          total: totalDocuments,
          by_type: documentTypes,
          by_status: {
            [ProcessingStatus.PENDING]: pendingCount,
            [ProcessingStatus.PROCESSING]: processingCount,
            [ProcessingStatus.PROCESSED]: successCount,
            [ProcessingStatus.FAILED]: failureCount,
          },
        },
        storage: {
          total_size_bytes: totalFileSize,
          total_size_mb: Math.round(totalFileSize / 1024 / 1024),
          average_document_size_mb:
            totalDocuments > 0
              ? Math.round((totalFileSize / totalDocuments / 1024 / 1024) * 100) / 100
              : 0,
        },
        vectorization: {
          total_chunks: totalVectors,
          total_vectors: totalVectors,
          embedding_provider: 'ollama',
          average_chunks_per_document:
            totalDocuments > 0 ? Math.round(totalVectors / totalDocuments) : 0,
        },
        usage: {
          total_queries: 0,
          documents_queried: 0,
          queries_per_document_avg: 0,
        },
        processing: {
          total_processing_time_seconds: Math.round(totalProcessingTime / 1000),
          average_processing_time_seconds: Math.round(avgProcessingTime / 1000),
          fastest_document_seconds: 0,
          slowest_document_seconds: 0,
        },
        last_activity: new Date().toISOString(),
      },
    };
  }

  /**
   * Delete a document and cleanup all associated data
   * Cascades to: PostgreSQL, ChromaDB, and filesystem
   */
  async deleteDocument(id: number): Promise<DeleteDocumentResponseDto> {
    // 1. Get document from database
    const document = await this.historicalDocumentRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    const deletionResponse: DeleteDocumentResponseDto = {
      success: true,
      message: 'Document deleted successfully',
      deleted_document: {
        id: document.id,
        rfp_number: document.rfp_number,
        title: document.title,
        status: document.status,
      },
      cleanup_summary: {
        removed_from_chromadb: false,
        vectors_deleted: 0,
        db_record_deleted: false,
        file_deleted: false,
        query_logs_cleaned: 0,
        processing_time_ms: 0,
      },
    };

    const startTime = Date.now();

    try {
      // 2. Delete from ChromaDB
      try {
        const deletedVectors = await this.deleteFromChromaDB(id);
        deletionResponse.cleanup_summary.vectors_deleted = deletedVectors;
        deletionResponse.cleanup_summary.removed_from_chromadb = deletedVectors > 0;
      } catch (error) {
        this.logger.warn(
          `Error deleting vectors from ChromaDB: ${error.message}`,
        );
      }

      // 3. Delete from filesystem
      try {
        if (document.file_path) {
          unlinkSync(document.file_path);
          deletionResponse.cleanup_summary.file_deleted = true;
        }
      } catch (error) {
        this.logger.warn(
          `Error deleting file from filesystem: ${error.message}`,
        );
      }

      // 4. Delete from PostgreSQL
      await this.historicalDocumentRepository.delete({ id });
      deletionResponse.cleanup_summary.db_record_deleted = true;

      deletionResponse.cleanup_summary.processing_time_ms = Date.now() - startTime;
      this.logger.log(`Document ${id} deleted successfully with cleanup`);

      return deletionResponse;
    } catch (error) {
      this.logger.error(`Error deleting document ${id}: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to delete document: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete document vectors from ChromaDB
   * Returns number of vectors deleted
   */
  private async deleteFromChromaDB(documentId: number): Promise<number> {
    const pythonServiceUrl = this.configService.get<string>(
      'PYTHON_RAG_SERVICE_URL',
      'http://localhost:8005',
    );

    try {
      const response = await firstValueFrom(
        this.httpService.delete(
          `${pythonServiceUrl}/api/documents/${documentId}`,
        ),
      );

      return response.data.vectors_deleted || 0;
    } catch (error) {
      this.logger.error(
        `Error calling ChromaDB deletion endpoint: ${error.message}`,
      );
      throw error;
    }
  }
}
