import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Query } from '../queries/entities/query.entity';
import { ProcessQueryDto } from './dto/process-query.dto';
import { AIResponseDto } from './dto/ai-response.dto';
import axios from 'axios';

@Injectable()
export class PrebidQueryService {
  private readonly logger = new Logger(PrebidQueryService.name);
  private readonly chiefEngineerUrl = process.env.CHIEF_ENGINEER_URL || 'http://localhost:8001';

  constructor(
    @InjectRepository(Query)
    private readonly queryRepository: Repository<Query>,
  ) {}

  /**
   * Get statistics for pre-bid queries
   */
  async getStatistics() {
    try {
      const [
        totalQueries,
        pending,
        underReview,
        answered,
        clarificationNeeded,
        aiProcessed,
      ] = await Promise.all([
        this.queryRepository.count(),
        this.queryRepository.count({ where: { status: 'pending' } }),
        this.queryRepository.count({ where: { status: 'under_review' } }),
        this.queryRepository.count({ where: { status: 'answered' } }),
        this.queryRepository.count({ where: { status: 'clarification_needed' } }),
        this.queryRepository.count({ where: { aiProcessed: true } }),
      ]);

      // Calculate average response time
      const answeredQueries = await this.queryRepository.find({
        where: { status: 'answered' },
        select: ['submittedAt', 'answeredAt'],
      });

      let avgResponseTime = 0;
      if (answeredQueries.length > 0) {
        const totalTime = answeredQueries.reduce((sum, query) => {
          if (query.answeredAt) {
            const diff = query.answeredAt.getTime() - query.submittedAt.getTime();
            return sum + diff / (1000 * 60 * 60); // Convert to hours
          }
          return sum;
        }, 0);
        avgResponseTime = Math.round(totalTime / answeredQueries.length);
      }

      // Calculate average confidence
      const confidenceResult = await this.queryRepository
        .createQueryBuilder('query')
        .select('AVG(query.confidence)', 'avgConfidence')
        .where('query.ai_processed = :aiProcessed', { aiProcessed: true })
        .getRawOne();

      return {
        success: true,
        data: {
          totalQueries,
          pending,
          underReview,
          answered,
          clarificationNeeded,
          aiProcessed,
          avgResponseTime,
          avgConfidence: parseFloat(confidenceResult?.avgConfidence || '0').toFixed(2),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching statistics:', error);
      throw new InternalServerErrorException('Failed to fetch statistics');
    }
  }

  /**
   * Get all queries with filters
   */
  async getQueries(filters: {
    status?: string;
    category?: string;
    rfpId?: string;
    aiProcessed?: boolean;
    search?: string;
    page: number;
    pageSize: number;
  }) {
    try {
      const { status, category, rfpId, aiProcessed, search, page, pageSize } = filters;
      const skip = (page - 1) * pageSize;

      const queryBuilder = this.queryRepository
        .createQueryBuilder('query')
        .orderBy('query.submitted_at', 'DESC');

      if (status) {
        queryBuilder.andWhere('query.status = :status', { status });
      }

      if (category) {
        // category is passed as string but DB has category_id as integer
        queryBuilder.andWhere('query.category_id = :categoryId', { categoryId: Number(category) });
      }

      if (rfpId) {
        queryBuilder.andWhere('query.rfp_id = :rfpId', { rfpId });
      }

      if (aiProcessed !== undefined) {
        queryBuilder.andWhere('query.ai_processed = :aiProcessed', { aiProcessed });
      }

      if (search) {
        queryBuilder.andWhere('query.query_text ILIKE :search', { search: `%${search}%` });
      }

      const [queries, total] = await queryBuilder
        .skip(skip)
        .take(pageSize)
        .getManyAndCount();

      // Query has no ORM relations to rfps/query_categories - resolve the
      // human-readable rfp_number/category_name with two small batch lookups.
      const rfpIds = [...new Set(queries.map((q) => q.rfpId).filter(Boolean))];
      const categoryIds = [...new Set(queries.map((q) => q.categoryId).filter(Boolean))];

      const rfpRows = rfpIds.length
        ? await this.queryRepository.manager.query(
            `SELECT rfp_id, rfp_number FROM rfps WHERE rfp_id = ANY($1::uuid[])`,
            [rfpIds],
          )
        : [];
      const rfpNumberById = new Map(rfpRows.map((r: any) => [r.rfp_id, r.rfp_number]));

      const categoryRows = categoryIds.length
        ? await this.queryRepository.manager.query(
            `SELECT category_id, category_name FROM query_categories WHERE category_id = ANY($1::int[])`,
            [categoryIds],
          )
        : [];
      const categoryNameById = new Map(
        categoryRows.map((c: any) => [c.category_id, c.category_name]),
      );

      const enrichedQueries = queries.map((q, index) => ({
        ...q,
        srNo: skip + index + 1,
        rfpNumber: rfpNumberById.get(q.rfpId) ?? null,
        categoryName: categoryNameById.get(q.categoryId) ?? null,
      }));

      return {
        success: true,
        data: {
          queries: enrichedQueries,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      };
    } catch (error) {
      this.logger.error('Error fetching queries:', error);
      this.logger.error('Error stack:', error.stack);
      this.logger.error('Error message:', error.message);
      throw new InternalServerErrorException(`Failed to fetch queries: ${error.message}`);
    }
  }

  /**
   * Get filter dropdown options (statuses, categories, rfps)
   */
  async getFilters() {
    try {
      const categories = await this.queryRepository.manager.query(
        `SELECT category_id AS id, category_name AS name FROM query_categories ORDER BY category_name`,
      );

      const rfps = await this.queryRepository.manager.query(
        `SELECT DISTINCT r.rfp_id AS id, r.rfp_number AS number
         FROM rfps r
         INNER JOIN queries q ON q.rfp_id = r.rfp_id
         ORDER BY r.rfp_number`,
      );

      return {
        success: true,
        data: {
          statuses: ['pending', 'under_review', 'answered', 'clarification_needed'],
          categories,
          rfps,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching filters:', error);
      throw new InternalServerErrorException('Failed to fetch filters');
    }
  }

  /**
   * Bulk update status for multiple queries at once
   */
  async bulkUpdateStatus(queryIds: string[], status: string) {
    try {
      const validStatuses = ['pending', 'under_review', 'answered', 'clarification_needed'];
      if (!validStatuses.includes(status)) {
        throw new InternalServerErrorException(`Invalid status: ${status}`);
      }

      const queries = await this.queryRepository.find({
        where: { queryId: In(queryIds) },
      });

      const now = new Date();
      for (const query of queries) {
        query.status = status;
        if (status === 'answered' && !query.answeredAt) {
          query.answeredAt = now;
        }
      }
      await this.queryRepository.save(queries);

      return {
        success: true,
        message: `Updated ${queries.length} of ${queryIds.length} queries to "${status}"`,
        data: {
          requested: queryIds.length,
          updated: queries.length,
          status,
        },
      };
    } catch (error) {
      this.logger.error('Error bulk updating status:', error);
      throw new InternalServerErrorException('Failed to bulk update status');
    }
  }

  /**
   * Get single query by ID
   */
  async getQueryById(id: string) {
    try {
      const query = await this.queryRepository.findOne({
        where: { queryId: id },
      });

      if (!query) {
        throw new NotFoundException(`Query with ID ${id} not found`);
      }

      return {
        success: true,
        data: query,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching query:', error);
      throw new InternalServerErrorException('Failed to fetch query');
    }
  }

  /**
   * Process query with Chief Engineer Agent
   */
  async processQuery(id: string, processDto: ProcessQueryDto) {
    try {
      const query = await this.queryRepository.findOne({
        where: { queryId: id },
      });

      if (!query) {
        throw new NotFoundException(`Query with ID ${id} not found`);
      }

      // Update status to under_review
      query.status = 'under_review';
      await this.queryRepository.save(query);

      // Call Chief Engineer Agent
      // Remove any top-level rfp_context from processDto to avoid FastAPI error
      // Prepare payload for FastAPI: rfp_id and category only inside rfp_context
      const restProcessDto = { ...(processDto || {}) };
      delete restProcessDto.rfpContext;
      // Prepare rfp_context with rfp_id and category as expected by FastAPI agent
      // Only send category and rfpNumber in rfp_context (no rfpId)
      let rfpContext: any = { ...((processDto.rfpContext as any) || {}) };
      // Remove rfpId and rfp_id if present
      delete rfpContext.rfpId;
      delete rfpContext.rfp_id;
      if (query.categoryId !== undefined && query.categoryId !== null) rfpContext.category = String(query.categoryId);

      // Convert rfpNumber to rfp_number (snake_case) for FastAPI compatibility
      if (rfpContext.rfpNumber) {
        rfpContext.rfp_number = rfpContext.rfpNumber;
        delete rfpContext.rfpNumber;
      }

      // min_confidence: convert 0-100 to 0.0-1.0 if needed
      let minConfidence: number | undefined = undefined;
      if (restProcessDto.minConfidence !== undefined) {
        minConfidence = restProcessDto.minConfidence > 1 ? restProcessDto.minConfidence / 100 : restProcessDto.minConfidence;
      }

      const payload: any = {
        query_id: query.queryId,
        query_text: query.queryText,
        rfp_context: rfpContext,
      };
      // Remove rfp_id from the top-level payload if present
      if ('rfp_id' in payload) {
        delete payload.rfp_id;
      }
      if (restProcessDto.useHistoricalData !== undefined) payload.use_historical_data = restProcessDto.useHistoricalData;
      if (restProcessDto.searchSimilarQueries !== undefined) payload.search_similar_queries = restProcessDto.searchSimilarQueries;
      if (restProcessDto.topK !== undefined) payload.top_k = restProcessDto.topK;
      if (minConfidence !== undefined) payload.min_confidence = minConfidence;
      if (restProcessDto.options !== undefined) payload.options = restProcessDto.options;

      // Debug: Log the full payload before sending
      console.log('DEBUG: Outgoing payload to Chief Engineer:', JSON.stringify(payload, null, 2));
      const response = await axios.post(
        `${this.chiefEngineerUrl}/api/chief-engineer/process`,
        payload,
        {
          timeout: 600000,
        },
      );

      // Update query with AI response
      // Note: Chief Engineer returns data in response.data.response object
      const responseData = response.data.response || response.data;
      const aiResponseText =
        responseData.ai_response ??
        responseData.response_text ??
        responseData.responseText ??
        responseData.aiResponse ??
        '';
      const pastRefResponseText =
        responseData.past_ref_response ??
        responseData.pastRefResponse ??
        responseData.past_ref ??
        null;
      const pastResponseText =
        responseData.past_response ?? responseData.pastResponse ?? null;
      const confidenceScoreRaw =
        responseData.confidence ??
        responseData.confidence_score ??
        responseData.confidenceScore ??
        0;
      const confidenceScore =
        confidenceScoreRaw >= 0 && confidenceScoreRaw <= 1
          ? confidenceScoreRaw * 100
          : confidenceScoreRaw;
      
      this.logger.debug(`[DEBUG] Confidence processing:`);
      this.logger.debug(`  - confidenceScoreRaw: ${confidenceScoreRaw}`);
      this.logger.debug(`  - confidenceScore (normalized): ${confidenceScore}`);
      this.logger.debug(`  - responseData keys: ${Object.keys(responseData)}`);
      
      query.aiProcessed = true;
      query.aiStatus = 'completed';
      query.processedAt = new Date();
      query.aiResponse = aiResponseText;
      query.pastRefResponse = pastRefResponseText;
      query.pastResponse = pastResponseText;
      query.confidence = confidenceScore;
      query.sourceDocuments = responseData.source_documents || [];
      query.executionId = responseData.execution_id || response.data.execution_id;

      await this.queryRepository.save(query);

      // Update response in ChromaDB vendor_queries collection (for future similar query searches)
      try {
        await axios.post(
          `${this.chiefEngineerUrl}/api/chief-engineer/update-response`,
          null,
          {
            params: {
              query_id: query.queryId,
              response_text: aiResponseText,
            },
          }
        );
        this.logger.log(`✓ Updated response in ChromaDB for query ${query.queryId}`);
      } catch (chromaError) {
        this.logger.warn(`⚠️ Failed to update response in ChromaDB: ${chromaError.message}`);
        // Don't throw - query is already saved to PostgreSQL, this is just for ChromaDB sync
      }

      return {
        success: true,
        message: 'Query processed successfully',
        data: {
          queryId: query.queryId,
          aiResponse: query.aiResponse,
          confidence: query.confidence,
          executionId: query.executionId,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error processing query:', error?.message, error?.stack);
      console.error('Error processing query:', error);
      throw new InternalServerErrorException('Failed to process query');
    }
  }

  /**
   * Update query status
   */
  async updateStatus(id: string, status: string) {
    try {
      const query = await this.queryRepository.findOne({
        where: { queryId: id },
      });

      if (!query) {
        throw new NotFoundException(`Query with ID ${id} not found`);
      }

      query.status = status;

      if (status === 'answered' && !query.answeredAt) {
        query.answeredAt = new Date();
      }

      await this.queryRepository.save(query);

      return {
        success: true,
        message: 'Status updated successfully',
        data: {
          queryId: query.queryId,
          status: query.status,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error updating status:', error);
      throw new InternalServerErrorException('Failed to update status');
    }
  }

  /**
   * Save admin response
   */
  async saveAdminResponse(id: string, responseDto: AIResponseDto) {
    try {
      const query = await this.queryRepository.findOne({
        where: { queryId: id },
      });

      if (!query) {
        throw new NotFoundException(`Query with ID ${id} not found`);
      }

      query.adminResponse = responseDto.response;
      query.status = 'answered';
      query.answeredAt = new Date();

      await this.queryRepository.save(query);

      return {
        success: true,
        message: 'Admin response saved successfully',
        data: {
          queryId: query.queryId,
          status: query.status,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error saving admin response:', error);
      throw new InternalServerErrorException('Failed to save admin response');
    }
  }

  /**
   * Get query history
   */
  async getQueryHistory(id: string) {
    try {
      const query = await this.queryRepository.findOne({
        where: { queryId: id },
      });

      if (!query) {
        throw new NotFoundException(`Query with ID ${id} not found`);
      }

      // Build history from query timestamps and status changes
      const history = [
        {
          action: 'Query Submitted',
          timestamp: query.submittedAt,
          user: 'Vendor',
        },
      ];

      if (query.processedAt) {
        history.push({
          action: 'AI Processing Completed',
          timestamp: query.processedAt,
          user: 'System',
        });
      }

      if (query.answeredAt) {
        history.push({
          action: 'Query Answered',
          timestamp: query.answeredAt,
          user: 'Admin',
        });
      }

      return {
        success: true,
        data: history,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching query history:', error);
      throw new InternalServerErrorException('Failed to fetch query history');
    }
  }

  /**
   * Get similar queries
   */
  async getSimilarQueries(id: string, limit: number) {
    try {
      const query = await this.queryRepository.findOne({
        where: { queryId: id },
      });

      if (!query) {
        throw new NotFoundException(`Query with ID ${id} not found`);
      }

      // Find similar queries (simple implementation - can be enhanced with vector similarity)
      const similarQueries = await this.queryRepository
        .createQueryBuilder('q')
        .where('q.rfp_id = :rfpId', { rfpId: query.rfpId })
        .andWhere('q.category_id = :categoryId', { categoryId: query.categoryId })
        .andWhere('q.query_id != :queryId', { queryId: id })
        .andWhere('q.ai_processed = :aiProcessed', { aiProcessed: true })
        .orderBy('q.confidence', 'DESC')
        .limit(limit)
        .getMany();

      return {
        success: true,
        data: similarQueries,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching similar queries:', error);
      throw new InternalServerErrorException('Failed to fetch similar queries');
    }
  }

  /**
   * Get workflow executions
   */
  async getWorkflowExecutions(pagination: { page: number; pageSize: number }) {
    try {
      const response = await axios.get(
        `${this.chiefEngineerUrl}/api/workflow/executions`,
        { params: pagination },
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      this.logger.error('Error fetching workflow executions:', error);
      throw new InternalServerErrorException('Failed to fetch workflow executions');
    }
  }

  /**
   * Get workflow execution details
   */
  async getWorkflowExecutionDetails(executionId: string) {
    try {
      const response = await axios.get(
        `${this.chiefEngineerUrl}/api/workflow/executions/${executionId}`,
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      this.logger.error('Error fetching workflow execution details:', error);
      throw new InternalServerErrorException('Failed to fetch workflow execution details');
    }
  }
}
