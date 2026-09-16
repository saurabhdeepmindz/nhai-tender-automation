import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, In } from 'typeorm';
import { Query } from '../entities/query.entity';
import { CreateQueryDto, QueryCategory } from '../dto/create-query.dto';
import { UpdateQueryDto, QueryStatus } from '../dto/update-query.dto';
import {
  QueryResponseDto,
  QueryListResponseDto,
  QueryStatisticsDto,
} from '../dto/query-response.dto';
import {
  BulkQueryAction,
  BulkUpdateQueriesDto,
} from '../dto/bulk-update-queries.dto';
import { ExportQueriesDto, ExportFormat } from '../dto/export-queries.dto';

// Maps the CreateQueryDto's category enum string to the query_categories.category_id
// it corresponds to (see query_categories table). Query.categoryId is the FK column;
// the DTO's `category` string has no matching entity column, so it must be translated
// here or it silently never reaches the database.
const CATEGORY_ID_MAP: Record<QueryCategory, number> = {
  [QueryCategory.TECHNICAL]: 10,
  [QueryCategory.COMMERCIAL]: 11,
  [QueryCategory.ELIGIBILITY]: 12,
  [QueryCategory.CONTRACTUAL]: 13,
  [QueryCategory.GENERAL]: 14,
};

export interface QueryFilters {
  status?: QueryStatus | QueryStatus[];
  category?: string;
  rfpId?: string;
  submittedBy?: string;
  aiProcessed?: boolean;
  adminReviewed?: boolean;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class QueriesService {
  private readonly logger = new Logger(QueriesService.name);

  constructor(
    @InjectRepository(Query)
    private readonly queryRepository: Repository<Query>,
  ) {}

  /**
   * Generate a unique query number
   */
  private async generateQueryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.queryRepository.count();
    const paddedNumber = String(count + 1).padStart(4, '0');
    return `QRY-${year}-${paddedNumber}`;
  }

  /**
   * Create a new query
   */
  async create(
    createQueryDto: CreateQueryDto,
    userId: string | null,
  ): Promise<QueryResponseDto> {
    try {
      this.logger.log(`Creating new query for user: ${userId}`);

      const queryNumber = await this.generateQueryNumber();
      const { category, ...rest } = createQueryDto;

      const query = this.queryRepository.create({
        ...rest,
        categoryId: CATEGORY_ID_MAP[category],
        queryNumber,
        vendorId: userId,
        status: QueryStatus.PENDING,
        aiProcessed: false,
        adminReviewed: false,
      });

      const savedQuery = await this.queryRepository.save(query);
      this.logger.log(`Query created successfully: ${savedQuery.queryNumber}`);

      return this.mapToResponseDto(savedQuery);
    } catch (error) {
      this.logger.error(`Error creating query: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create query');
    }
  }

  /**
   * Find all queries with pagination and filters
   */
  async findAll(
    filters: QueryFilters = {},
    pagination: PaginationOptions = { page: 1, pageSize: 20 },
  ): Promise<QueryListResponseDto> {
    try {
      const { page, pageSize, sortBy = 'submittedAt', sortOrder = 'DESC' } = pagination;
      const skip = (page - 1) * pageSize;

      const where: FindOptionsWhere<Query> = {};

      // Apply filters
      if (filters.status) {
        where.status = Array.isArray(filters.status)
          ? In(filters.status)
          : filters.status;
      }
      if (filters.category) {
        where.categoryId = filters.category as any;
      }
      if (filters.rfpId) {
        where.rfpId = filters.rfpId;
      }
      if (filters.submittedBy) {
        where.vendorId = filters.submittedBy;
      }
      if (filters.aiProcessed !== undefined) {
        where.aiProcessed = filters.aiProcessed;
      }
      if (filters.adminReviewed !== undefined) {
        where.adminReviewed = filters.adminReviewed;
      }

      // Search filter
      if (filters.search) {
        where.queryText = Like(`%${filters.search}%`);
      }

      const [queries, total] = await this.queryRepository.findAndCount({
        where,
        skip,
        take: pageSize,
        order: { [sortBy]: sortOrder },
      });

      const totalPages = Math.ceil(total / pageSize);

      return {
        queries: queries.map((q) => this.mapToResponseDto(q)),
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Error fetching queries: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch queries');
    }
  }

  /**
   * Find one query by ID
   */
  async findOne(queryId: string): Promise<QueryResponseDto> {
    try {
      const query = await this.queryRepository.findOne({
        where: { queryId },
      });

      if (!query) {
        throw new NotFoundException(`Query with ID ${queryId} not found`);
      }

      return this.mapToResponseDto(query);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching query: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch query');
    }
  }

  /**
   * Update a query
   */
  async update(
    queryId: string,
    updateQueryDto: UpdateQueryDto,
    userId?: string,
  ): Promise<QueryResponseDto> {
    try {
      const query = await this.queryRepository.findOne({
        where: { queryId },
      });

      if (!query) {
        throw new NotFoundException(`Query with ID ${queryId} not found`);
      }

      // Update fields
      Object.assign(query, updateQueryDto);

      // Set timestamps based on status changes
      if (updateQueryDto.status === QueryStatus.ANSWERED && !query.answeredAt) {
        query.answeredAt = new Date();
        if (userId) {
          query.metadata = { ...query.metadata, answeredBy: userId };
        }
      }

      if (updateQueryDto.aiResponse && !query.processedAt) {
        query.processedAt = new Date();
        query.aiProcessed = true;
      }

      if (updateQueryDto.adminResponse && !query.adminReviewed) {
        query.adminReviewed = true;
      }

      const updatedQuery = await this.queryRepository.save(query);
      this.logger.log(`Query updated successfully: ${updatedQuery.queryNumber}`);

      return this.mapToResponseDto(updatedQuery);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error updating query: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update query');
    }
  }

  /**
   * Bulk update multiple queries
   */
  async bulkUpdate(
    bulkUpdateDto: BulkUpdateQueriesDto,
    userId?: string,
  ): Promise<{
    action: BulkQueryAction;
    updatedCount: number;
    failedIds: string[];
    totalRequested: number;
  }> {
    const { queryIds, action, assignTo } = bulkUpdateDto;

    if (action === BulkQueryAction.ASSIGN && !assignTo) {
      throw new BadRequestException('assignTo is required for assign action');
    }

    const queries = await this.queryRepository.findBy({ queryId: In(queryIds) });

    if (!queries.length) {
      throw new NotFoundException('No queries found for provided IDs');
    }

    const foundIds = new Set(queries.map((q) => q.queryId));
    const failedIds = queryIds.filter((id) => !foundIds.has(id));

    const now = new Date();

    const updates = queries.map((query) => {
      switch (action) {
        case BulkQueryAction.ACCEPT:
          query.status = QueryStatus.ANSWERED;
          query.adminReviewed = true;
          query.answeredAt = query.answeredAt || now;
          if (userId) {
            query.metadata = { ...query.metadata, answeredBy: userId };
          }
          break;
        case BulkQueryAction.REJECT:
          query.status = QueryStatus.CLARIFICATION_NEEDED;
          query.adminReviewed = true;
          break;
        case BulkQueryAction.ASSIGN:
          query.metadata = {
            ...(query.metadata || {}),
            assignedTo: assignTo,
          };
          break;
        default:
          throw new BadRequestException('Unsupported bulk action');
      }

      query.updatedAt = now;
      return query;
    });

    await this.queryRepository.save(updates);

    return {
      action,
      updatedCount: updates.length,
      failedIds,
      totalRequested: queryIds.length,
    };
  }

  /**
   * Delete a query (soft delete by updating status)
   */
  async remove(queryId: string): Promise<void> {
    try {
      const query = await this.queryRepository.findOne({
        where: { queryId },
      });

      if (!query) {
        throw new NotFoundException(`Query with ID ${queryId} not found`);
      }

      // Hard delete - use with caution
      await this.queryRepository.remove(query);
      this.logger.log(`Query deleted successfully: ${query.queryNumber}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error deleting query: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to delete query');
    }
  }

  /**
   * Export queries as CSV (base64 encoded)
   */
  async exportQueries(
    exportQueriesDto: ExportQueriesDto,
  ): Promise<{ fileName: string; contentType: string; data: string; count: number }>
  {
    const { queryIds, format = ExportFormat.CSV } = exportQueriesDto;

    if (format === ExportFormat.XLSX) {
      throw new BadRequestException('XLSX export not supported yet. Use CSV.');
    }

    const queries = await this.queryRepository.findBy({ queryId: In(queryIds) });

    if (!queries.length) {
      throw new NotFoundException('No queries found for provided IDs');
    }

    const headers = [
      'Query ID',
      'Query Number',
      'RFP ID',
      'Submitted By',
      'Category',
      'Status',
      'Priority',
      'Submitted At',
      'Answered At',
      'AI Processed',
      'Admin Reviewed',
      'Confidence',
      'Execution ID',
      'Assigned To',
    ];

    const formatDate = (date?: Date) => (date ? date.toISOString() : '');
    const escape = (value?: string | number | boolean | null) => {
      const str = value === undefined || value === null ? '' : String(value);
      return str.includes(',') || str.includes('"')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const lines = queries.map((query) => [
      escape(query.queryId),
      escape(query.queryNumber),
      escape(query.rfpId),
      escape(query.vendorId),
      escape(query.categoryId),
      escape(query.status),
      escape(query.priority),
      escape(formatDate(query.submittedAt)),
      escape(formatDate(query.answeredAt)),
      escape(query.aiProcessed),
      escape(query.adminReviewed),
      escape(query.confidence),
      escape(query.executionId),
      escape(query.metadata?.assignedTo),
    ].join(','));

    const csv = [headers.join(','), ...lines].join('\n');
    const buffer = Buffer.from(csv, 'utf-8');

    return {
      fileName: `queries_${Date.now()}.csv`,
      contentType: 'text/csv',
      data: buffer.toString('base64'),
      count: queries.length,
    };
  }

  /**
   * Get query statistics
   */
  async getStatistics(filters: QueryFilters = {}): Promise<QueryStatisticsDto> {
    try {
      const where: FindOptionsWhere<Query> = {};

      // Apply filters
      if (filters.rfpId) {
        where.rfpId = filters.rfpId;
      }
      if (filters.submittedBy) {
        where.vendorId = filters.submittedBy;
      }

      const [
        total,
        pending,
        underReview,
        answered,
        clarificationNeeded,
        aiProcessed,
      ] = await Promise.all([
        this.queryRepository.count({ where }),
        this.queryRepository.count({
          where: { ...where, status: QueryStatus.PENDING },
        }),
        this.queryRepository.count({
          where: { ...where, status: QueryStatus.UNDER_REVIEW },
        }),
        this.queryRepository.count({
          where: { ...where, status: QueryStatus.ANSWERED },
        }),
        this.queryRepository.count({
          where: { ...where, status: QueryStatus.CLARIFICATION_NEEDED },
        }),
        this.queryRepository.count({
          where: { ...where, aiProcessed: true },
        }),
      ]);

      // Calculate average response time
      const answeredQueries = await this.queryRepository.find({
        where: { ...where, status: QueryStatus.ANSWERED },
        select: ['submittedAt', 'answeredAt'],
      });

      let avgResponseTime = 0;
      if (answeredQueries.length > 0) {
        const totalResponseTime = answeredQueries.reduce((sum, query) => {
          if (query.answeredAt) {
            const diff =
              query.answeredAt.getTime() - query.submittedAt.getTime();
            return sum + diff / (1000 * 60 * 60); // Convert to hours
          }
          return sum;
        }, 0);
        avgResponseTime = Math.round(totalResponseTime / answeredQueries.length);
      }

      // Calculate average confidence
      const result = await this.queryRepository
        .createQueryBuilder('query')
        .select('AVG(query.confidence)', 'avgConfidence')
        .where({ ...where, aiProcessed: true })
        .getRawOne();

      const avgConfidence: string = result?.avgConfidence
        ? parseFloat(result.avgConfidence).toFixed(2)
        : '0';

      return {
        total,
        pending,
        underReview,
        answered,
        clarificationNeeded,
        aiProcessed,
        avgResponseTime,
        avgConfidence: parseFloat(avgConfidence),
      };
    } catch (error) {
      this.logger.error(
        `Error fetching statistics: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch statistics');
    }
  }

  /**
   * Get queries by vendor
   */
  async findByVendor(
    vendorId: string,
    pagination: PaginationOptions = { page: 1, pageSize: 20 },
  ): Promise<QueryListResponseDto> {
    return this.findAll({ submittedBy: vendorId }, pagination);
  }

  /**
   * Get queries by RFP
   */
  async findByRfp(
    rfpId: string,
    pagination: PaginationOptions = { page: 1, pageSize: 20 },
  ): Promise<QueryListResponseDto> {
    return this.findAll({ rfpId }, pagination);
  }

  /**
   * Mark query for AI processing
   */
  async markForAIProcessing(queryId: string): Promise<QueryResponseDto> {
    return this.update(queryId, {
      status: QueryStatus.UNDER_REVIEW,
    });
  }

  /**
   * Update query with AI response
   */
  async updateWithAIResponse(
    queryId: string,
    aiResponse: string,
    pastRefResponse?: string,
    pastResponse?: string,
    confidence?: number,
    sourceDocuments?: string[],
    executionId?: string,
  ): Promise<QueryResponseDto> {
    const query = await this.queryRepository.findOne({ where: { queryId } });
    if (!query) {
      throw new NotFoundException(`Query with ID ${queryId} not found`);
    }
    query.aiResponse = aiResponse;
    query.pastRefResponse = pastRefResponse;
    query.pastResponse = pastResponse;
    query.confidence = confidence;
    query.sourceDocuments = sourceDocuments;
    query.executionId = executionId;
    query.aiProcessed = true;
    query.processedAt = new Date();
    const updated = await this.queryRepository.save(query);
    return this.mapToResponseDto(updated);
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(query: Query): QueryResponseDto {
    const dto = {
      queryId: query.queryId,
      queryNumber: query.queryNumber,
      rfpId: query.rfpId,
      submittedBy: query.vendorId,
      category: QueryCategory.GENERAL as any, // Default category - categoryId mapping TBD
      queryText: query.queryText,
      attachments: query.hasAttachments ? [] : undefined,
      status: query.status as QueryStatus,
      priority: query.priority,
      aiProcessed: query.aiProcessed,
      adminReviewed: query.adminReviewed,
      submittedAt: query.submittedAt,
      updatedAt: query.updatedAt,
      respondedAt: query.answeredAt,
      aiResponse: query.aiResponse,
      pastRefResponse: query.pastRefResponse,
      pastResponse: query.pastResponse,
      adminResponse: query.adminResponse,
      confidence: query.confidence ? parseFloat(query.confidence.toString()) : undefined,
      sourceDocuments: query.sourceDocuments,
      executionId: query.executionId,
      processedAt: query.processedAt,
      answeredAt: query.answeredAt,
      answeredBy: query.metadata?.answeredBy,
      metadata: query.metadata,
      // Expose async queue/status fields
      aiStatus: query.aiStatus,
      queuePosition: query.queuePosition,
      estimatedCompletionTime: query.estimatedCompletionTime,
    };
    // Log the DTO for debugging
    this.logger.log(`[QueryResponseDto] ${JSON.stringify(dto, null, 2)}`);
    // Also log to console for visibility
    // eslint-disable-next-line no-console
    console.log('[QueryResponseDto]', dto);
    return dto;
  }
}
