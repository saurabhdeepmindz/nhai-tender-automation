/**
 * NHAI Tender Query Automation System
 * Query Vectorization Background Job
 * 
 * Purpose:
 * - Automatically vectorize queries submitted by vendors
 * - Runs every 5 minutes to find unvectorized queries
 * - Stores query embeddings in ChromaDB via Screen 8
 * - Updates PostgreSQL vectorization status
 * 
 * File: backend/src/jobs/query-vectorization.job.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Query } from '../queries/entities/query.entity';
import { VectorizationService } from '../vectorization/vectorization.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QueryVectorizationJob {
  private readonly logger = new Logger(QueryVectorizationJob.name);
  private isRunning = false;
  private readonly batchSize: number;
  private readonly enabled: boolean;

  constructor(
    @InjectRepository(Query)
    private readonly queryRepository: Repository<Query>,
    private readonly vectorizationService: VectorizationService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    // Load configuration
    this.batchSize = this.configService.get<number>(
      'VECTORIZATION_BATCH_SIZE',
      10,
    );
    this.enabled = this.configService.get<boolean>(
      'VECTORIZATION_ENABLED',
      true,
    );

    if (this.enabled) {
      this.logger.log('Query Vectorization Job initialized');
      this.logger.log(`Batch size: ${this.batchSize}`);
      this.logger.log('Schedule: Every 5 minutes');
    } else {
      this.logger.warn('Query Vectorization Job is DISABLED');
    }
  }

  /**
   * Main Cron Job - Runs every 5 minutes
   * Finds and vectorizes unprocessed queries
   */
  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'query-vectorization',
  })
  async handleQueryVectorization(): Promise<void> {
    // Check if enabled
    if (!this.enabled) {
      this.logger.debug('Vectorization is disabled, skipping...');
      return;
    }

    // Prevent concurrent executions
    if (this.isRunning) {
      this.logger.warn('Previous vectorization job still running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      this.logger.log('============================================');
      this.logger.log('Starting Query Vectorization Job');
      this.logger.log('============================================');

      // Find unvectorized queries
      const unvectorizedQueries = await this.findUnvectorizedQueries();

      if (unvectorizedQueries.length === 0) {
        this.logger.log('No unvectorized queries found');
        return;
      }

      this.logger.log(
        `Found ${unvectorizedQueries.length} queries to vectorize`,
      );

      // Process queries
      const results = await this.processQueries(unvectorizedQueries);

      // Log summary
      this.logJobSummary(results, startTime);
    } catch (error) {
      this.logger.error('Query vectorization job failed:', error.stack);
    } finally {
      this.isRunning = false;
      this.logger.log('============================================');
      this.logger.log('Query Vectorization Job Completed');
      this.logger.log('============================================');
    }
  }

  /**
   * Find queries that need vectorization
   */
  private async findUnvectorizedQueries(): Promise<Query[]> {
    try {
      const queries = await this.queryRepository.find({
        where: {
          vectorized: false,
          status: In(['pending', 'under_review', 'answered']),
        },
        relations: ['rfp', 'category', 'submittedBy'],
        take: this.batchSize,
        order: {
          submittedAt: 'ASC', // Process oldest first (FIFO)
        },
      });

      return queries;
    } catch (error) {
      this.logger.error('Error finding unvectorized queries:', error.stack);
      throw error;
    }
  }

  /**
   * Process batch of queries
   */
  private async processQueries(
    queries: Query[],
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const query of queries) {
      try {
        this.logger.log(
          `[${results.success + results.failed + 1}/${queries.length}] ` +
            `Processing query: ${query.queryId}`,
        );

        await this.vectorizationService.vectorizeQuery(query);

        results.success++;
        this.logger.log(`✓ Successfully vectorized: ${query.queryId}`);
      } catch (error) {
        results.failed++;
        results.errors.push({
          queryId: query.queryId,
          error: error.message,
        });

        this.logger.error(
          `✗ Failed to vectorize query ${query.queryId}: ${error.message}`,
        );

        // Continue with next query instead of stopping
        continue;
      }
    }

    return results;
  }

  /**
   * Log job summary
   */
  private logJobSummary(
    results: { success: number; failed: number; errors: any[] },
    startTime: number,
  ): void {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    this.logger.log('');
    this.logger.log('Job Summary:');
    this.logger.log(`  Total Processed: ${results.success + results.failed}`);
    this.logger.log(`  ✓ Successful: ${results.success}`);
    this.logger.log(`  ✗ Failed: ${results.failed}`);
    this.logger.log(`  Duration: ${duration}s`);

    if (results.errors.length > 0) {
      this.logger.warn('Failed queries:');
      results.errors.forEach((err) => {
        this.logger.warn(`  - ${err.queryId}: ${err.error}`);
      });
    }
  }

  /**
   * Manual trigger for vectorization
   * Can be called from admin panel or API endpoint
   */
  async vectorizeQueryById(queryId: string): Promise<void> {
    this.logger.log(`Manual vectorization triggered for query: ${queryId}`);

    try {
      const query = await this.queryRepository.findOne({
        where: { queryId },
        relations: ['rfp', 'category', 'submittedBy'],
      });

      if (!query) {
        throw new Error(`Query ${queryId} not found`);
      }

      await this.vectorizationService.vectorizeQuery(query);

      this.logger.log(`✓ Successfully vectorized query: ${queryId}`);
    } catch (error) {
      this.logger.error(
        `✗ Failed to vectorize query ${queryId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Batch vectorize multiple queries by IDs
   * Useful for bulk operations from admin panel
   */
  async batchVectorizeByIds(queryIds: string[]): Promise<{
    success: number;
    failed: number;
    errors: any[];
  }> {
    this.logger.log(
      `Manual batch vectorization triggered for ${queryIds.length} queries`,
    );

    const queries = await this.queryRepository.find({
      where: { queryId: In(queryIds) },
      relations: ['rfp', 'category', 'submittedBy'],
    });

    if (queries.length === 0) {
      throw new Error('No queries found with provided IDs');
    }

    return await this.processQueries(queries);
  }

  /**
   * Re-vectorize all queries (force update)
   * CAUTION: This will vectorize ALL queries, even if already vectorized
   */
  async revectorizeAll(limit = 100): Promise<void> {
    this.logger.warn(`Starting re-vectorization of all queries (limit: ${limit})`);

    try {
      const queries = await this.queryRepository.find({
        relations: ['rfp', 'category', 'submittedBy'],
        take: limit,
        order: {
          submittedAt: 'DESC', // Most recent first
        },
      });

      this.logger.log(`Found ${queries.length} queries to re-vectorize`);

      const results = await this.processQueries(queries);

      this.logger.log('Re-vectorization completed:');
      this.logger.log(`  ✓ Successful: ${results.success}`);
      this.logger.log(`  ✗ Failed: ${results.failed}`);
    } catch (error) {
      this.logger.error('Re-vectorization failed:', error.stack);
      throw error;
    }
  }

  /**
   * Get vectorization statistics
   */
  async getVectorizationStats(): Promise<{
    total: number;
    vectorized: number;
    pending: number;
    percentage: number;
  }> {
    try {
      const total = await this.queryRepository.count();
      const vectorized = await this.queryRepository.count({
        where: { vectorized: true },
      });
      const pending = total - vectorized;
      const percentage = total > 0 ? (vectorized / total) * 100 : 0;

      return {
        total,
        vectorized,
        pending,
        percentage: Math.round(percentage * 100) / 100,
      };
    } catch (error) {
      this.logger.error('Error getting vectorization stats:', error.stack);
      throw error;
    }
  }

  /**
   * Pause the cron job
   */
  pauseJob(): void {
    const job = this.schedulerRegistry.getCronJob('query-vectorization');
    job.stop();
    this.logger.warn('Query Vectorization Job PAUSED');
  }

  /**
   * Resume the cron job
   */
  resumeJob(): void {
    const job = this.schedulerRegistry.getCronJob('query-vectorization');
    job.start();
    this.logger.log('Query Vectorization Job RESUMED');
  }

  /**
   * Check if job is currently running
   */
  isJobRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get job configuration
   */
  getJobConfig(): {
    enabled: boolean;
    batchSize: number;
    schedule: string;
    isRunning: boolean;
  } {
    return {
      enabled: this.enabled,
      batchSize: this.batchSize,
      schedule: 'Every 5 minutes',
      isRunning: this.isRunning,
    };
  }
}
