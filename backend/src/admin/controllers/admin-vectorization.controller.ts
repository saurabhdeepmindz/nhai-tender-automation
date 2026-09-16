// ...existing code...
/**
 * NHAI Tender Query Automation System
 * Admin Vectorization Controller
 * 
 * Purpose:
 * - Admin-specific endpoints for vectorization management
 * - Get vectorization statistics
 * - List queries with vectorization status
 * - Control background job (pause/resume)
 * - Batch operations
 * 
 * File: backend/src/admin/controllers/admin-vectorization.controller.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import {
  Controller,
  Get,
  Post,
  Query as QueryParam,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../../auth/guards/roles.guard';
// import { Roles } from '../../auth/decorators/roles.decorator';
// import { UserRole } from '../../users/enums/user-role.enum';
import { Query } from '../../queries/entities/query.entity';
import { VectorizationLog } from '../../vectorization/entities/vectorization-log.entity';
import { QueryVectorizationJob } from '../../jobs/query-vectorization.job';

@ApiTags('Admin - Vectorization')
// @ApiBearerAuth()
@Controller('admin/vectorization')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(UserRole.ADMIN, UserRole.CHIEF_ENGINEER)
export class AdminVectorizationController {
  private readonly logger = new Logger(AdminVectorizationController.name);

  constructor(
    @InjectRepository(Query)
    private readonly queryRepository: Repository<Query>,
    @InjectRepository(VectorizationLog)
    private readonly vectorizationLogRepository: Repository<VectorizationLog>,
    private readonly queryVectorizationJob: QueryVectorizationJob,
  ) {}

  /**
   * Get vectorization statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get vectorization statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getVectorizationStats() {
    try {
      // Get basic stats from the database
      const totalQueries = await this.queryRepository.count();
      const vectorizedQueries = await this.queryRepository.count({
        where: { vectorized: true },
      });
      const pendingQueries = totalQueries - vectorizedQueries;

      // Get recent logs
      const recentLogs = await this.vectorizationLogRepository.find({
        take: 10,
        order: { attemptedAt: 'DESC' },
      });

      const stats = {
        totalQueries,
        vectorizedQueries,
        pendingQueries,
        vectorizationRate: totalQueries > 0 
          ? Math.round((vectorizedQueries / totalQueries) * 100) 
          : 0,
        recentActivity: recentLogs.map(log => ({
          queryId: log.queryId,
          status: log.status,
          attemptedAt: log.attemptedAt,
          duration: log.duration,
        })),
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error('Error getting vectorization stats:', error.stack);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all queries with vectorization status
   */
  @Get('queries')
  @ApiOperation({ summary: 'Get queries with vectorization status' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'vectorized', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Queries retrieved successfully',
  })
  async getQueries(
    @QueryParam('limit') limit = 100,
    @QueryParam('offset') offset = 0,
    @QueryParam('vectorized') vectorized?: string,
  ) {
    try {
      const whereCondition: any = {};

      // Filter by vectorization status if specified
      if (vectorized !== undefined) {
        whereCondition.vectorized = vectorized === 'true';
      }

      const [queries, total] = await this.queryRepository.findAndCount({
        where: whereCondition,
        take: Number(limit),
        skip: Number(offset),
        order: {
          submittedAt: 'DESC',
        },
      });

      // Query has no ORM relations to rfps/query_categories, so resolve the
      // human-readable rfp_number/category_name with two small batch lookups
      // instead of exposing raw rfpId/categoryId (which the frontend can't render).
      const rfpIds = [...new Set(queries.map((q) => q.rfpId).filter(Boolean))];
      const categoryIds = [
        ...new Set(queries.map((q) => q.categoryId).filter(Boolean)),
      ];

      const rfpRows = rfpIds.length
        ? await this.queryRepository.manager.query(
            `SELECT rfp_id, rfp_number FROM rfps WHERE rfp_id = ANY($1::uuid[])`,
            [rfpIds],
          )
        : [];
      const rfpNumberById = new Map(
        rfpRows.map((r: any) => [r.rfp_id, r.rfp_number]),
      );

      const categoryRows = categoryIds.length
        ? await this.queryRepository.manager.query(
            `SELECT category_id, category_name FROM query_categories WHERE category_id = ANY($1::int[])`,
            [categoryIds],
          )
        : [];
      const categoryNameById = new Map(
        categoryRows.map((c: any) => [c.category_id, c.category_name]),
      );

      // Transform to include only necessary fields
      const transformedQueries = queries.map((query) => ({
        queryId: query.queryId,
        queryText: query.queryText,
        rfpNumber: rfpNumberById.get(query.rfpId) ?? null,
        category: categoryNameById.get(query.categoryId) ?? null,
        submittedBy: query.vendorId,
        submittedAt: query.submittedAt,
        vectorized: query.vectorized,
        vectorStoredAt: query.vectorStoredAt,
        status: query.status,
      }));

      return {
        success: true,
        data: transformedQueries,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + transformedQueries.length < total,
        },
      };
    } catch (error) {
      this.logger.error('Error getting queries:', error.stack);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get pending queries (not vectorized)
   */
  @Get('queries/pending')
  @ApiOperation({ summary: 'Get pending queries awaiting vectorization' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Pending queries retrieved successfully',
  })
  async getPendingQueries(@QueryParam('limit') limit = 50) {
    try {
      const queries = await this.queryRepository.find({
        where: {
          vectorized: false,
          status: In(['pending', 'under_review']),
        },
        // relations: ['rfp', 'category', 'submittedBy'],
        take: Number(limit),
        order: {
          submittedAt: 'ASC', // Oldest first
        },
      });

      const transformedQueries = queries.map((query) => ({
        queryId: query.queryId,
        queryText: query.queryText,
        rfpId: query.rfpId,
        categoryId: query.categoryId,
        vendorId: query.vendorId,
        submittedAt: query.submittedAt,
        waitingTime: this.calculateWaitingTime(query.submittedAt),
      }));

      return {
        success: true,
        count: transformedQueries.length,
        data: transformedQueries,
      };
    } catch (error) {
      this.logger.error('Error getting pending queries:', error.stack);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get vectorization logs
   */
  @Get('logs')
  @ApiOperation({ summary: 'Get vectorization attempt logs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['success', 'failed', 'all'] })
  @ApiResponse({
    status: 200,
    description: 'Logs retrieved successfully',
  })
  async getVectorizationLogs(
    @QueryParam('limit') limit = 100,
    @QueryParam('status') status?: 'success' | 'failed' | 'all',
  ) {
    try {
      const whereCondition: any = {};

      if (status && status !== 'all') {
        whereCondition.status = status;
      }

      const logs = await this.vectorizationLogRepository.find({
        where: whereCondition,
        take: Number(limit),
        order: {
          attemptedAt: 'DESC',
        },
      });

      return {
        success: true,
        count: logs.length,
        data: logs,
      };
    } catch (error) {
      this.logger.error('Error getting vectorization logs:', error.stack);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get performance metrics
   */
  @Get('metrics')
  @ApiOperation({ summary: 'Get vectorization performance metrics' })
  @ApiResponse({
    status: 200,
    description: 'Metrics retrieved successfully',
  })
  async getPerformanceMetrics() {
    try {
      // Get successful attempts from last 24 hours
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const successfulLogs = await this.vectorizationLogRepository
        .createQueryBuilder('log')
        .select('AVG(log.duration)', 'avgDuration')
        .addSelect('MIN(log.duration)', 'minDuration')
        .addSelect('MAX(log.duration)', 'maxDuration')
        .addSelect('COUNT(*)', 'totalAttempts')
        .where('log.status = :status', { status: 'success' })
        .andWhere('log.attemptedAt > :date', { date: last24Hours })
        .getRawOne();

      // Get failure count
      const failedCount = await this.vectorizationLogRepository.count({
        where: {
          status: 'failed',
          attemptedAt: In([last24Hours, new Date()]),
        },
      });

      // Calculate success rate
      const totalAttempts = Number(successfulLogs.totalAttempts) + failedCount;
      const successRate =
        totalAttempts > 0
          ? (Number(successfulLogs.totalAttempts) / totalAttempts) * 100
          : 0;

      return {
        success: true,
        data: {
          last24Hours: {
            avgDuration: Math.round(Number(successfulLogs.avgDuration) || 0),
            minDuration: Number(successfulLogs.minDuration) || 0,
            maxDuration: Number(successfulLogs.maxDuration) || 0,
            totalAttempts: Number(successfulLogs.totalAttempts) || 0,
            failedAttempts: failedCount,
            successRate: Math.round(successRate * 100) / 100,
          },
        },
      };
    } catch (error) {
      this.logger.error('Error getting performance metrics:', error.stack);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get job configuration
   */
  @Get('job/config')
  @ApiOperation({ summary: 'Get background job configuration' })
  @ApiResponse({
    status: 200,
    description: 'Job configuration retrieved successfully',
  })
  async getJobConfig() {
    try {
      const config = this.queryVectorizationJob.getJobConfig();
      return {
        success: true,
        data: config,
      };
    } catch (error) {
      this.logger.error('Error getting job config:', error.stack);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Pause background job
   */
  @Post('job/pause')
  @ApiOperation({ summary: 'Pause the vectorization background job' })
  @ApiResponse({
    status: 200,
    description: 'Job paused successfully',
  })
  async pauseJob() {
    try {
      this.queryVectorizationJob.pauseJob();
      this.logger.warn('Background vectorization job paused by admin');
      return {
        success: true,
        message: 'Background job paused successfully',
      };
    } catch (error) {
      this.logger.error('Error pausing job:', error.stack);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Resume background job
   */
  @Post('job/resume')
  @ApiOperation({ summary: 'Resume the vectorization background job' })
  @ApiResponse({
    status: 200,
    description: 'Job resumed successfully',
  })
  async resumeJob() {
    try {
      this.queryVectorizationJob.resumeJob();
      this.logger.log('Background vectorization job resumed by admin');
      return {
        success: true,
        message: 'Background job resumed successfully',
      };
    } catch (error) {
      this.logger.error('Error resuming job:', error.stack);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Trigger job manually (run now)
   */
  @Post('job/run-now')
  @ApiOperation({ summary: 'Manually trigger the vectorization job immediately' })
  @ApiResponse({
    status: 200,
    description: 'Job triggered successfully',
  })
  async runJobNow() {
    try {
      this.logger.log('Manual vectorization job trigger requested by admin');

      // Run the job asynchronously
      this.queryVectorizationJob
        .handleQueryVectorization()
        .then(() => {
          this.logger.log('Manual vectorization job completed');
        })
        .catch((error) => {
          this.logger.error('Manual vectorization job failed:', error.stack);
        });

      return {
        success: true,
        message: 'Vectorization job triggered. Check logs for progress.',
      };
    } catch (error) {
      this.logger.error('Error triggering job:', error.stack);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Force re-vectorize all queries
   */
  @Post('job/revectorize-all')
  @ApiOperation({
    summary: 'Force re-vectorize all queries (CAUTION: Heavy operation)',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Re-vectorization started',
  })
  async revectorizeAll(@QueryParam('limit') limit = 100) {
    try {
      this.logger.warn(
        `Admin initiated re-vectorization of all queries (limit: ${limit})`,
      );

      // Run asynchronously
      this.queryVectorizationJob
        .revectorizeAll(Number(limit))
        .then(() => {
          this.logger.log('Re-vectorization completed');
        })
        .catch((error) => {
          this.logger.error('Re-vectorization failed:', error.stack);
        });

      return {
        success: true,
        message: `Re-vectorization started for up to ${limit} queries. This may take several minutes.`,
      };
    } catch (error) {
      this.logger.error('Error starting re-vectorization:', error.stack);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get dashboard summary
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Get complete dashboard summary' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  async getDashboard() {
    try {
      const [pendingQueries, failedLogs, metrics] =
        await Promise.all([
          // this.queryVectorizationJob.getVectorizationStats(),
          this.queryRepository.count({
            where: { vectorized: false },
          }),
          this.vectorizationLogRepository.count({
            where: { status: 'failed' },
          }),
          this.getPerformanceMetrics(),
          // this.queryVectorizationJob.getJobConfig(),
        ]);

      return {
        success: true,
        data: {
          // statistics: stats,
          pending: pendingQueries,
          failed: failedLogs,
          performance: metrics.data,
          // jobStatus: jobConfig,
        },
      };
    } catch (error) {
      this.logger.error('Error getting dashboard data:', error.stack);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Helper: Calculate waiting time
   */
  private calculateWaitingTime(submittedAt: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - submittedAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} minutes`;
    }

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} hours`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days`;
  }

  /**
   * Get current vectorization job status (enabled/disabled)
   */
  @Get('job-status')
  @ApiOperation({ summary: 'Get current vectorization job enabled/disabled status' })
  @ApiResponse({ status: 200, description: 'Job status retrieved successfully' })
  async getJobStatus() {
    try {
      const enabled = this.queryVectorizationJob.isJobEnabled();
      return { success: true, enabled };
    } catch (error) {
      this.logger.error('Error getting job status:', error.stack);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
