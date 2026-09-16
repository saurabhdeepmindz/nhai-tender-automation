// ...existing code...
// ...existing code...
/**
 * NHAI Tender Query Automation System
 * Query Vectorization Service
 * 
 * Purpose:
 * - Handles vectorization of queries to ChromaDB
 * - Communicates with Screen 8 Python API
 * - Updates PostgreSQL vectorization status
 * - Provides retry logic and error handling
 * 
 * File: backend/src/vectorization/vectorization.service.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, retry } from 'rxjs';
import { Query } from '../queries/entities/query.entity';
import { VectorizationLog } from './entities/vectorization-log.entity';

/**
 * DTO for Screen 8 API request
 */
interface StoreQueryRequest {
  query_id: string;
  query_text: string;
  category: string;
  rfp_number: string;
  metadata: {
    submitted_by: string;
    submitted_at: string;
    priority: string;
    rfp_title?: string;
    project_name?: string;
    vendor_name?: string;
    category_id?: number;
  };
}

/**
 * DTO for Screen 8 API response
 */
interface StoreQueryResponse {
  success: boolean;
  query_id: string;
  message: string;
  embedding_dimension?: number;
  processing_time?: number;
}

/**
 * DTO for Screen 8 AI Answer response
 */
interface AIAnswerResponse {
  success: boolean;
  query_id: string;
  answer: string;
  confidence: number;
  processing_time: number;
  past_ref_response?: string;
  past_response?: string;
}

@Injectable()
export class VectorizationService {
  private readonly logger = new Logger(VectorizationService.name);
  private readonly screen8Url: string;
  private readonly requestTimeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(
    @InjectRepository(Query)
    private readonly queryRepository: Repository<Query>,
    @InjectRepository(VectorizationLog)
    private readonly vectorizationLogRepository: Repository<VectorizationLog>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Load configuration
    this.screen8Url = this.configService.get<string>(
      'SCREEN8_URL',
      'http://localhost:8001',
    );
    this.requestTimeout = this.configService.get<number>(
      'VECTORIZATION_TIMEOUT',
      300000, // 3 minutes (Chief Engineer takes 80-110s to process)
    );
    this.maxRetries = this.configService.get<number>(
      'VECTORIZATION_MAX_RETRIES',
      3,
    );
    this.retryDelay = this.configService.get<number>(
      'VECTORIZATION_RETRY_DELAY',
      2000, // 2 seconds
    );

    this.logger.log('Vectorization Service initialized');
    this.logger.log(`Screen 8 URL: ${this.screen8Url}`);
    this.logger.log(`Request timeout: ${this.requestTimeout}ms`);
    this.logger.log(`Max retries: ${this.maxRetries}`);
  }

  /**
   * Call Chief Engineer/Screen 8 API to get AI response for a query
   * Now returns complete response including past references and responses from Instance 4
   */
  async getAIResponseForQuery(query: Query): Promise<AIAnswerResponse> {
    try {
      const url = `${this.screen8Url}/api/chief-engineer/answer-query`;
      this.logger.debug(`Calling Chief Engineer for AI response: ${url}`);
      const response = await firstValueFrom(
        this.httpService.post(url, {
          query_id: query.queryId,
          query_text: query.queryText,
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: this.requestTimeout,
        })
      );
      if (response.status === 200 && response.data && response.data.answer) {
        const aiResponse: AIAnswerResponse = {
          success: response.data.success,
          query_id: response.data.query_id,
          answer: response.data.answer,
          confidence: response.data.confidence,
          processing_time: response.data.processing_time,
          past_ref_response: response.data.past_ref_response,
          past_response: response.data.past_response,
        };
        this.logger.debug(`AI Response received: ${aiResponse.answer.substring(0, 100)}...`);
        this.logger.debug(`Past RFP References: ${aiResponse.past_ref_response ? aiResponse.past_ref_response.substring(0, 50) : 'None'}...`);
        this.logger.debug(`Past Response: ${aiResponse.past_response ? aiResponse.past_response.substring(0, 50) : 'None'}...`);
        return aiResponse;
      } else {
        throw new Error('No AI answer received');
      }
    } catch (error: any) {
      this.logger.error(`Chief Engineer AI response error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Main method: Vectorize a query and store in ChromaDB
   */
  async vectorizeQuery(query: Query): Promise<void> {
    const startTime = Date.now();
    let attempt = 0;

    try {
      this.logger.debug(`Starting vectorization for query: ${query.queryId}`);

      // Validate query data
      this.validateQuery(query);

      // Prepare request payload
      const requestPayload = this.prepareRequestPayload(query);

      // Call Screen 8 API with retry logic
      let response: StoreQueryResponse;
      while (attempt < this.maxRetries) {
        attempt++;
        try {
          this.logger.debug(
            `Attempt ${attempt}/${this.maxRetries} for query: ${query.queryId}`,
          );

          response = await this.callScreen8Api(requestPayload);
          break; // Success, exit retry loop
        } catch (error) {
          if (attempt >= this.maxRetries) {
            throw error; // Max retries reached
          }

          this.logger.warn(
            `Attempt ${attempt} failed for query ${query.queryId}, retrying in ${this.retryDelay}ms...`,
          );

          // Wait before retry
          await this.sleep(this.retryDelay);
        }
      }

      // Validate response
      if (!response.success) {
        throw new Error(
          `Screen 8 returned failure: ${response.message || 'Unknown error'}`,
        );
      }

      // Update PostgreSQL: store AI response and set aiStatus to 'completed'
      await this.updateQueryVectorizationWithAI(query.queryId, true, response.message, 'completed');

      // Log success
      const duration = Date.now() - startTime;
      await this.logVectorization(query.queryId, 'success', duration, response);

      this.logger.debug(
        `✓ Query ${query.queryId} vectorized successfully in ${duration}ms`,
      );
    } catch (error) {
      // Log failure
      const duration = Date.now() - startTime;
      await this.logVectorization(
        query.queryId,
        'failed',
        duration,
        null,
        error.message,
      );

      // Set aiStatus to 'failed' for retry
      await this.updateQueryVectorizationWithAI(query.queryId, false, null, 'failed');

      this.logger.error(
        `✗ Failed to vectorize query ${query.queryId} after ${attempt} attempts: ${error.message}`,
      );

      throw error;
    }
  }

  /**
   * Validate query has required fields
   */
  private validateQuery(query: Query): void {
    if (!query.queryId) {
      throw new Error('Query ID is missing');
    }

    if (!query.queryText || query.queryText.trim().length === 0) {
      throw new Error('Query text is empty');
    }

    if (!query.rfpId) {
      throw new Error('RFP ID is missing');
    }

    if (!query.categoryId) {
      throw new Error('Category information is missing');
    }

    if (!query.vendorId) {
      throw new Error('Vendor information is missing');
    }
  }

  /**
   * Prepare request payload for Screen 8 API
   */
  private prepareRequestPayload(query: Query): StoreQueryRequest {
    return {
      query_id: query.queryId,
      query_text: query.queryText.trim(),
      category: query.categoryId ? query.categoryId.toString() : 'general',
      rfp_number: query.rfpId,
      metadata: {
        submitted_by: query.vendorId || 'unknown',
        submitted_at: query.submittedAt.toISOString(),
        priority: query.priority || 'normal',
        rfp_title: 'N/A',
        project_name: 'N/A',
        vendor_name: 'N/A',
        category_id: query.categoryId || 0,
      },
    };
  }

  /**
   * Call Screen 8 API to store query in ChromaDB
   */
  private async callScreen8Api(
    payload: StoreQueryRequest,
  ): Promise<StoreQueryResponse> {
    try {
      const url = `${this.screen8Url}/api/chief-engineer/store-query`;

      this.logger.debug(`Calling Screen 8 API: ${url}`);

      const response = await firstValueFrom(
        this.httpService
          .post<StoreQueryResponse>(url, payload, {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: this.requestTimeout,
          }),
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(
          `Screen 8 API returned status ${response.status}`,
        );
      }

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(
          'Cannot connect to Screen 8 API. Is the service running?',
        );
      }

      if (error.name === 'TimeoutError') {
        throw new Error(
          `Screen 8 API request timed out after ${this.requestTimeout}ms`,
        );
      }

      throw new Error(`Screen 8 API error: ${error.message}`);
    }
  }

  /**
   * Update query vectorization status in PostgreSQL
   */
  // Update query vectorization status, AI response, and aiStatus
  private async updateQueryVectorizationWithAI(
    queryId: string,
    vectorized: boolean,
    aiResponse: string | null,
    aiStatus: 'completed' | 'failed',
    pastRefResponse?: string | null,
    pastResponse?: string | null,
  ): Promise<void> {
    try {
      await this.queryRepository.update(queryId, {
        vectorized,
        vectorStoredAt: vectorized ? new Date() : null,
        aiResponse: aiResponse,
        aiStatus: aiStatus,
        pastRefResponse: pastRefResponse || null,
        pastResponse: pastResponse || null,
      });
    } catch (error) {
      this.logger.error(
        `Failed to update vectorization/AI status for query ${queryId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Log vectorization attempt
   */
  private async logVectorization(
    queryId: string,
    status: 'success' | 'failed',
    duration: number,
    response?: StoreQueryResponse,
    errorMessage?: string,
  ): Promise<void> {
    try {
      const log = this.vectorizationLogRepository.create({
        queryId,
        status,
        duration,
        embeddingDimension: response?.embedding_dimension,
        processingTime: response?.processing_time,
        errorMessage,
        attemptedAt: new Date(),
      });

      await this.vectorizationLogRepository.save(log);
    } catch (error) {
      // Don't throw, just log the error
      this.logger.error(
        `Failed to log vectorization for query ${queryId}: ${error.message}`,
      );
    }
  }

  /**
   * Batch vectorize multiple queries
   */
  async batchVectorize(queryIds: string[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ queryId: string; error: string }>;
  }> {
    this.logger.log(`Starting batch vectorization of ${queryIds.length} queries`);

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    const queries = await this.queryRepository.find({
      where: { queryId: In(queryIds) },
    });

    for (const query of queries) {
      try {
        await this.vectorizeQuery(query);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          queryId: query.queryId,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Batch vectorization completed: ${results.success} success, ${results.failed} failed`,
    );

    return results;
  }

  /**
   * Delete query from vector database
   */
  async deleteQueryFromVectorDb(queryId: string): Promise<void> {
    try {
      this.logger.log(`Deleting query ${queryId} from vector database`);

      const url = `${this.screen8Url}/api/chief-engineer/delete-query/${queryId}`;

      const response = await firstValueFrom(
        this.httpService.delete(url, {
          timeout: this.requestTimeout,
        }),
      );

      if (response.data.success) {
        // Update PostgreSQL
        await this.updateQueryVectorizationWithAI(queryId, false, null, 'failed');

        this.logger.log(`Query ${queryId} deleted from vector database`);
      } else {
        throw new Error(response.data.message || 'Deletion failed');
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete query ${queryId} from vector database: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Check if Screen 8 API is available
   */
  async checkScreen8Health(): Promise<boolean> {
    try {
      const url = `${this.screen8Url}/api/health`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 5000, // 5 seconds
        }),
      );

      return response.data.status === 'healthy';
    } catch (error) {
      this.logger.error(`Screen 8 health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get vectorization statistics for a query
   */
  async getQueryVectorizationInfo(queryId: string): Promise<{
    queryId: string;
    vectorized: boolean;
    vectorStoredAt: Date | null;
    lastAttempt: Date | null;
    attemptCount: number;
    lastError: string | null;
  }> {
    const query = await this.queryRepository.findOne({
      where: { queryId },
      select: ['queryId', 'vectorized', 'vectorStoredAt'],
    });

    if (!query) {
      throw new Error(`Query ${queryId} not found`);
    }

    const logs = await this.vectorizationLogRepository.find({
      where: { queryId },
      order: { attemptedAt: 'DESC' },
      take: 1,
    });

    const totalAttempts = await this.vectorizationLogRepository.count({
      where: { queryId },
    });

    return {
      queryId: query.queryId,
      vectorized: query.vectorized,
      vectorStoredAt: query.vectorStoredAt,
      lastAttempt: logs[0]?.attemptedAt || null,
      attemptCount: totalAttempts,
      lastError: logs[0]?.errorMessage || null,
    };
  }

  /**
   * Get failed vectorizations
   */
  async getFailedVectorizations(limit = 20): Promise<VectorizationLog[]> {
    return await this.vectorizationLogRepository.find({
      where: { status: 'failed' },
      order: { attemptedAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Retry failed vectorizations
   */
  async retryFailedVectorizations(): Promise<{
    success: number;
    failed: number;
  }> {
    this.logger.log('Retrying failed vectorizations...');

    const failedLogs = await this.getFailedVectorizations(50);
    const uniqueQueryIds = [...new Set(failedLogs.map((log) => log.queryId))];

    this.logger.log(`Found ${uniqueQueryIds.length} unique failed queries to retry`);

    return await this.batchVectorize(uniqueQueryIds);
  }

  /**
   * Helper: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get service configuration
   */
  getServiceConfig(): {
    screen8Url: string;
    requestTimeout: number;
    maxRetries: number;
    retryDelay: number;
  } {
    return {
      screen8Url: this.screen8Url,
      requestTimeout: this.requestTimeout,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
    };
  }
}
