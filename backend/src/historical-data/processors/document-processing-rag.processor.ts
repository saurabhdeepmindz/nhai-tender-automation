/**
 * NHAI Tender Query Automation System
 * Enhanced Document Processing Background Job Processor (with RAG Integration)
 * 
 * Purpose:
 * - Process uploaded documents in background using Bull queue
 * - Direct integration with DocumentProcessor + EmbeddingService + VectorStoreService
 * - Call Python service for vectorization and ChromaDB storage
 * - Support Ollama (primary) and OpenAI (fallback) embeddings
 * - Track document in vector store by source (document_id)
 * - Update document status in PostgreSQL
 * - Handle errors and retries with exponential backoff
 * 
 * Architecture:
 * 1. Bull Queue receives job → 2. Mark as PROCESSING → 3. Call Python service
 * 4. Python service: Load → Split → Embed → Store in ChromaDB
 * 5. Update status with metadata → 6. Return success or FAILED status
 * 
 * File: backend/src/historical-data/processors/document-processing-rag.processor.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bull';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { HistoricalDataService } from '../historical-data.service';
import { HistoricalDocument, ProcessingStatus } from '../entities/historical-document.entity';
import { resolve } from 'path';

interface DocumentProcessingJob {
  documentId: number;
  filePath: string;
  fileName: string;
  fileType: string;
  documentType: string;
  rfpNumber: string;
  title: string;
  description?: string;
}

interface PythonProcessingResponse {
  success: boolean;
  document_id: number;
  chunks_processed: number;
  vector_ids: string[];
  extracted_content: string;
  processing_time: number;
  embedding_provider: string;
  chunks_metadata?: Array<{
    chunk_id: string;
    chunk_index: number;
    tokens: number;
  }>;
}

@Processor('document-processing')
export class DocumentProcessingRagProcessor {
  private readonly logger = new Logger(DocumentProcessingRagProcessor.name);
  private readonly pythonServiceUrl: string;
  private readonly maxRetries: number = 3;

  constructor(
    private readonly historicalDataService: HistoricalDataService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(HistoricalDocument)
    private readonly historicalDocumentRepository: Repository<HistoricalDocument>,
  ) {
    this.pythonServiceUrl = this.configService.get<string>(
      'HISTORICAL_DATA_SERVICE_URL',
      'http://localhost:8005',
    );
  }

  /**
   * Main processor for historical document processing
   * Integrates with RAG pipeline through Python service
   */
  @Process('process-historical-document')
  async handleDocumentProcessing(job: Job<DocumentProcessingJob>) {
    const { documentId, filePath, fileName, documentType, rfpNumber, title, description } =
      job.data;

    this.logger.log(
      `🚀 [Job #${job.id}] Starting RAG processing for document ${documentId}: ${fileName}`,
    );
    this.logger.log(
      `   Document Type: ${documentType} | RFP: ${rfpNumber} | Retries: ${job.attemptsMade}/${this.maxRetries}`,
    );

    try {
      // Step 1: Validate document exists
      const document = await this.historicalDocumentRepository.findOne({
        where: { id: documentId },
      });

      if (!document) {
        throw new Error(`Document ${documentId} not found in database`);
      }

      // Step 2: Update status to PROCESSING
      await this.historicalDataService.updateDocumentStatus(
        documentId,
        ProcessingStatus.PROCESSING,
        {
          job_id: job.id.toString(),
          started_at: new Date().toISOString(),
          retry_count: job.attemptsMade,
        },
      );

      this.logger.log(`   ✅ Status updated to PROCESSING`);

      // Step 3: Prepare absolute file path
      const absoluteFilePath = resolve(process.cwd(), filePath);
      this.logger.log(`   📁 Processing file: ${absoluteFilePath}`);

      // Step 4: Call Python service for vectorization
      const startTime = Date.now();
      this.logger.log(`   📤 Calling Python RAG service at ${this.pythonServiceUrl}`);

      const response = await this._callPythonService({
        documentId,
        filePath: absoluteFilePath,
        fileName,
        documentType,
        rfpNumber,
        title,
      });

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `   ✅ Python service completed successfully in ${(processingTime / 1000).toFixed(2)}s`,
      );
      this.logger.log(
        `   📊 Processing Results: ${response.chunks_processed} chunks | ` +
        `${response.vector_ids.length} vectors | Provider: ${response.embedding_provider}`,
      );

      // Step 5: Prepare metadata for database
      const processingMetadata = {
        chunks_processed: response.chunks_processed,
        vector_ids: response.vector_ids,
        processing_time_ms: processingTime,
        embedding_provider: response.embedding_provider,
        chunks_metadata: response.chunks_metadata || [],
        python_service_url: this.pythonServiceUrl,
        completed_at: new Date().toISOString(),
        job_id: job.id.toString(),
      };

      // Step 6: Extract first 5000 chars of content
      const extractedContentPreview = response.extracted_content?.substring(0, 5000);

      // Step 7: Update status to PROCESSED
      await this.historicalDataService.updateDocumentStatus(
        documentId,
        ProcessingStatus.PROCESSED,
        processingMetadata,
        extractedContentPreview,
      );

      this.logger.log(
        `   ✅ Document ${documentId} successfully processed and stored in ChromaDB`,
      );
      this.logger.log(
        `   🎉 Total processing time: ${(processingTime / 1000).toFixed(2)}s`,
      );

      return {
        success: true,
        documentId,
        processingTime,
        chunks: response.chunks_processed,
        vectors: response.vector_ids.length,
        embeddingProvider: response.embedding_provider,
      };
    } catch (error) {
      this.logger.error(
        `   ❌ Error processing document ${documentId} (Attempt ${job.attemptsMade + 1}/${this.maxRetries}): ${error.message}`,
        error.stack,
      );

      // Prepare error metadata
      const errorMetadata = {
        error_message: error.message,
        error_type: error.name,
        error_stack: error.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines of stack
        error_response: error.response?.data || null,
        failed_at: new Date().toISOString(),
        job_id: job.id?.toString(),
        attempt: job.attemptsMade + 1,
        max_retries: this.maxRetries,
      };

      // Only update to FAILED if this is the last attempt
      if (job.attemptsMade >= this.maxRetries - 1) {
        this.logger.error(
          `   🛑 Max retries (${this.maxRetries}) reached. Marking document as FAILED.`,
        );

        await this.historicalDataService.updateDocumentStatus(
          documentId,
          ProcessingStatus.FAILED,
          errorMetadata,
        );

        // Log failure for monitoring
        this.logger.error(
          `Final failure for document ${documentId}: ${JSON.stringify(errorMetadata, null, 2)}`,
        );
      } else {
        // Still retrying
        this.logger.warn(
          `   ⏳ Will retry (${job.attemptsMade + 1}/${this.maxRetries})`,
        );
        await this.historicalDataService.updateDocumentStatus(
          documentId,
          ProcessingStatus.PENDING,
          errorMetadata,
        );
      }

      // Re-throw for Bull's retry mechanism
      throw error;
    }
  }

  /**
   * Call Python RAG service to process document
   * Handles vectorization, embeddings, and ChromaDB storage
   */
  private async _callPythonService(jobData: {
    documentId: number;
    filePath: string;
    fileName: string;
    documentType: string;
    rfpNumber: string;
    title: string;
  }): Promise<PythonProcessingResponse> {
    const timeoutMs = 5 * 60 * 1000; // 5 minutes timeout

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.pythonServiceUrl}/api/process-document`,
          {
            document_id: jobData.documentId,
            file_path: jobData.filePath,
            file_name: jobData.fileName,
            document_type: jobData.documentType,
            rfp_number: jobData.rfpNumber,
            title: jobData.title,
          },
          {
            timeout: timeoutMs,
            headers: {
              'Content-Type': 'application/json',
              'X-Document-Source': `document_${jobData.documentId}`,
            },
          },
        ),
      );

      // Validate response structure
      if (!response.data.success) {
        throw new Error(
          `Python service returned error: ${response.data.message || 'Unknown error'}`,
        );
      }

      return response.data as PythonProcessingResponse;
    } catch (error) {
      // Enhanced error handling for different scenarios
      if (error.code === 'ECONNREFUSED') {
        throw new Error(
          `Cannot connect to Python RAG service at ${this.pythonServiceUrl}. ` +
          `Is the service running on port 8005?`,
        );
      }

      if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        throw new Error(
          `Python service timed out after ${timeoutMs / 1000}s while processing file. ` +
          `File may be too large or service is slow.`,
        );
      }

      if (error.response?.status === 404) {
        throw new Error(
          `Python service endpoint not found. Check Python service is running correctly.`,
        );
      }

      if (error.response?.status === 400) {
        const errorDetail = error.response.data?.detail || error.response.data?.message;
        throw new Error(
          `Python service validation error: ${errorDetail || 'Invalid request'}`,
        );
      }

      if (error.response?.status >= 500) {
        throw new Error(
          `Python service error (${error.response.status}): ` +
          `${error.response.data?.message || error.message}`,
        );
      }

      // Default error
      throw error;
    }
  }

  /**
   * Called when job is completed successfully
   */
  onCompleted(job: Job<DocumentProcessingJob>) {
    this.logger.log(
      `✅ Job #${job.id} completed successfully for document ${job.data.documentId}`,
    );
  }

  /**
   * Called when job fails and enters retry queue
   */
  onFailed(job: Job<DocumentProcessingJob>, error: Error) {
    if (job.attemptsMade < this.maxRetries - 1) {
      // Calculate next retry delay based on exponential backoff (5000 * 5^attemptsMade)
      const nextRetryDelay = 5000 * Math.pow(5, job.attemptsMade);
      this.logger.warn(
        `⏳ Job #${job.id} failed (attempt ${job.attemptsMade + 1}/${this.maxRetries}), ` +
        `will retry in ${nextRetryDelay / 1000}s. Error: ${error.message}`,
      );
    } else {
      this.logger.error(
        `🛑 Job #${job.id} failed permanently after ${job.attemptsMade + 1} attempts. ` +
        `Error: ${error.message}`,
      );
    }
  }
}
