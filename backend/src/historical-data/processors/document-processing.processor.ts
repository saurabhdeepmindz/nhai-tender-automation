/**
 * NHAI Tender Query Automation System
 * Document Processing Background Job Processor
 * 
 * Purpose:
 * - Process uploaded documents in background using Bull queue
 * - Call Python service for text extraction and vectorization
 * - Support Ollama (primary) and OpenAI (fallback) embeddings
 * - Update document status in PostgreSQL
 * - Handle errors and retries
 * 
 * File: backend/src/historical-data/processors/document-processing.processor.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { HistoricalDataService } from '../historical-data.service';
import { ProcessingStatus } from '../entities/historical-document.entity';
import { resolve } from 'path';

interface DocumentProcessingJob {
  documentId: number;
  filePath: string;
  fileName: string;
  fileType: string;
  documentType: string;
  rfpNumber: string;
  title: string;
}

@Processor('document-processing')
export class DocumentProcessingProcessor {
  private readonly logger = new Logger(DocumentProcessingProcessor.name);
  private readonly pythonServiceUrl: string;

  constructor(
    private readonly historicalDataService: HistoricalDataService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.pythonServiceUrl = this.configService.get<string>(
      'HISTORICAL_DATA_SERVICE_URL',
      'http://localhost:8005',
    );
  }

  @Process('process-historical-document')
  async handleDocumentProcessing(job: Job<DocumentProcessingJob>) {
    const { documentId, filePath, fileName, documentType, rfpNumber, title } =
      job.data;

    this.logger.log(
      `🔄 Processing document ${documentId}: ${fileName} (${documentType})`,
    );

    try {
      // Update status to PROCESSING
      await this.historicalDataService.updateDocumentStatus(
        documentId,
        ProcessingStatus.PROCESSING,
      );

      // Call Python service for document processing
      const startTime = Date.now();

      this.logger.log(`📤 Calling Python service at ${this.pythonServiceUrl}`);

      // Convert relative path to absolute path
      const absoluteFilePath = resolve(process.cwd(), filePath);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.pythonServiceUrl}/api/process-document`,
          {
            document_id: documentId,
            file_path: absoluteFilePath,
            file_name: fileName,
            document_type: documentType,
            rfp_number: rfpNumber,
            title: title,
          },
          {
            timeout: 300000, // 5 minutes
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Python service completed in ${processingTime}ms: ${response.data.chunks_processed} chunks`,
      );

      // Update status to PROCESSED with metadata
      await this.historicalDataService.updateDocumentStatus(
        documentId,
        ProcessingStatus.PROCESSED,
        {
          chunks_processed: response.data.chunks_processed,
          vector_ids: response.data.vector_ids,
          processing_time: processingTime,
          embedding_provider: response.data.embedding_provider,
        },
        response.data.extracted_content?.substring(0, 5000), // First 5000 chars
      );

      return {
        success: true,
        documentId,
        processingTime,
        chunks: response.data.chunks_processed,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error processing document ${documentId}: ${error.message}`,
        error.stack,
      );

      // Update status to FAILED with error details
      await this.historicalDataService.updateDocumentStatus(
        documentId,
        ProcessingStatus.FAILED,
        {
          error_message: error.message,
          error_stack: error.response?.data || error.stack,
          failed_at: new Date().toISOString(),
        },
      );

      throw error; // Re-throw for Bull retry mechanism
    }
  }
}
