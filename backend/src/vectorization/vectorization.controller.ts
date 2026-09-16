/**
 * NHAI Tender Query Automation System
 * Vectorization Controller
 * 
 * Purpose:
 * - Provide API endpoints for manual vectorization
 * - Allow admin panel to trigger vectorization
 * - Provide vectorization statistics and logs
 * 
 * File: backend/src/vectorization/vectorization.controller.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  HttpStatus,
  HttpException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VectorizationService } from './vectorization.service';
import { Query } from '../queries/entities/query.entity';
import { Roles } from './stub-decorators';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { UserRole } from '../users/enums/user-role.enum';

// Stub enum for roles
enum UserRole {
  ADMIN = 'admin',
  CHIEF_ENGINEER = 'chief_engineer',
  VENDOR = 'vendor',
}

/**
 * DTOs
 */
class VectorizeQueryDto {
  queryId: string;
}

class BatchVectorizeDto {
  queryIds: string[];
}

@ApiTags('Vectorization')
// @ApiBearerAuth()
@Controller('vectorization')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class VectorizationController {
  private readonly logger = new Logger(VectorizationController.name);

  constructor(
    private readonly vectorizationService: VectorizationService,
    @InjectRepository(Query)
    private readonly queryRepository: Repository<Query>,
  ) {}

  /**
   * Manually vectorize a single query
   * Admin only
   */
  @Post('query/:queryId')
  @Roles(UserRole.ADMIN, UserRole.CHIEF_ENGINEER)
  @ApiOperation({ summary: 'Manually vectorize a query' })
  @ApiResponse({
    status: 200,
    description: 'Query vectorized successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Query not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Vectorization failed',
  })
  async vectorizeQuery(@Param('queryId') queryId: string) {
    try {
      this.logger.log(`Manual vectorization requested for query: ${queryId}`);

      const query = await this.queryRepository.findOne({ where: { queryId } });
      if (!query) {
        throw new Error(`Query ${queryId} not found`);
      }

      await this.vectorizationService.vectorizeQuery(query);

      return {
        success: true,
        message: `Query ${queryId} vectorized successfully`,
        queryId,
      };
    } catch (error) {
      this.logger.error(`Vectorization failed for query ${queryId}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: `Vectorization failed: ${error.message}`,
          queryId,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Batch vectorize multiple queries
   * Admin only
   */
  @Post('batch')
  @Roles(UserRole.ADMIN, UserRole.CHIEF_ENGINEER)
  @ApiOperation({ summary: 'Batch vectorize multiple queries' })
  @ApiResponse({
    status: 200,
    description: 'Batch vectorization completed',
  })
  async batchVectorize(@Body() dto: BatchVectorizeDto) {
    try {
      this.logger.log(`Batch vectorization requested for ${dto.queryIds.length} queries`);

      const results = await this.vectorizationService.batchVectorize(dto.queryIds);

      return {
        success: true,
        message: 'Batch vectorization completed',
        results: {
          total: dto.queryIds.length,
          successful: results.success,
          failed: results.failed,
          errors: results.errors,
        },
      };
    } catch (error) {
      this.logger.error(`Batch vectorization failed: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: `Batch vectorization failed: ${error.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get vectorization info for a query
   */
  @Get('query/:queryId/info')
  @Roles(UserRole.ADMIN, UserRole.CHIEF_ENGINEER)
  @ApiOperation({ summary: 'Get vectorization info for a query' })
  async getVectorizationInfo(@Param('queryId') queryId: string) {
    try {
      const info = await this.vectorizationService.getQueryVectorizationInfo(
        queryId,
      );

      return {
        success: true,
        data: info,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Get failed vectorizations
   */
  @Get('failures')
  @Roles(UserRole.ADMIN, UserRole.CHIEF_ENGINEER)
  @ApiOperation({ summary: 'Get failed vectorization attempts' })
  async getFailedVectorizations() {
    try {
      const failures = await this.vectorizationService.getFailedVectorizations(50);

      return {
        success: true,
        count: failures.length,
        data: failures,
      };
    } catch (error) {
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
   * Retry failed vectorizations
   */
  @Post('retry-failures')
  @Roles(UserRole.ADMIN, UserRole.CHIEF_ENGINEER)
  @ApiOperation({ summary: 'Retry all failed vectorizations' })
  async retryFailedVectorizations() {
    try {
      this.logger.log('Retrying failed vectorizations...');

      const results = await this.vectorizationService.retryFailedVectorizations();

      return {
        success: true,
        message: 'Retry completed',
        results: {
          successful: results.success,
          failed: results.failed,
        },
      };
    } catch (error) {
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
   * Delete query from vector database
   */
  @Delete('query/:queryId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete query from vector database' })
  async deleteFromVectorDb(@Param('queryId') queryId: string) {
    try {
      this.logger.log(`Deleting query ${queryId} from vector database`);

      await this.vectorizationService.deleteQueryFromVectorDb(queryId);

      return {
        success: true,
        message: `Query ${queryId} deleted from vector database`,
        queryId,
      };
    } catch (error) {
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
   * Check Screen 8 API health
   */
  @Get('health/screen8')
  @Roles(UserRole.ADMIN, UserRole.CHIEF_ENGINEER)
  @ApiOperation({ summary: 'Check Screen 8 API health' })
  async checkScreen8Health() {
    try {
      const isHealthy = await this.vectorizationService.checkScreen8Health();

      return {
        success: true,
        screen8: {
          status: isHealthy ? 'healthy' : 'unhealthy',
          url: this.vectorizationService.getServiceConfig().screen8Url,
        },
      };
    } catch (error) {
      return {
        success: false,
        screen8: {
          status: 'error',
          error: error.message,
        },
      };
    }
  }

  /**
   * Get service configuration
   */
  @Get('config')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get vectorization service configuration' })
  async getConfiguration() {
    return {
      success: true,
      config: this.vectorizationService.getServiceConfig(),
    };
  }
}
