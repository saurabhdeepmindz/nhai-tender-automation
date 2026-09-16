import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query as QueryParam,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { QueriesService, QueryFilters, PaginationOptions } from '../services/queries.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateQueryDto } from '../dto/create-query.dto';
import { UpdateQueryDto, QueryStatus } from '../dto/update-query.dto';
import {
  QueryResponseDto,
  QueryListResponseDto,
  QueryStatisticsDto,
} from '../dto/query-response.dto';
import { BulkUpdateQueriesDto } from '../dto/bulk-update-queries.dto';
import { ExportQueriesDto } from '../dto/export-queries.dto';

@ApiTags('Queries')
@Controller('queries')
@ApiBearerAuth()
export class QueriesController {
  constructor(private readonly queriesService: QueriesService) {}

  /**
   * Create a new query
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create a new query',
    description: 'Vendor submits a new query for an RFP',
  })
  @ApiBody({ type: CreateQueryDto })
  @ApiResponse({
    status: 201,
    description: 'Query created successfully',
    type: QueryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Body() createQueryDto: CreateQueryDto,
    @Request() req: any,
  ): Promise<QueryResponseDto> {
    // Extract user ID from the JWT (JwtAuthGuard/JwtStrategy populate req.user).
    const userId = req.user?.userId ?? null;
    return this.queriesService.create(createQueryDto, userId);
  }

  /**
   * Get all queries with pagination and filters
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all queries',
    description: 'Retrieve queries with pagination and optional filters',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: QueryStatus })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'rfpId', required: false, type: String })
  @ApiQuery({ name: 'submittedBy', required: false, type: String })
  @ApiQuery({ name: 'aiProcessed', required: false, type: Boolean })
  @ApiQuery({ name: 'adminReviewed', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'submittedAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], example: 'DESC' })
  @ApiResponse({
    status: 200,
    description: 'Queries retrieved successfully',
    type: QueryListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @QueryParam('page') page = 1,
    @QueryParam('pageSize') pageSize = 20,
    @QueryParam('status') status?: QueryStatus,
    @QueryParam('category') category?: string,
    @QueryParam('rfpId') rfpId?: string,
    @QueryParam('submittedBy') submittedBy?: string,
    @QueryParam('aiProcessed') aiProcessed?: boolean,
    @QueryParam('adminReviewed') adminReviewed?: boolean,
    @QueryParam('search') search?: string,
    @QueryParam('sortBy') sortBy?: string,
    @QueryParam('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ): Promise<QueryListResponseDto> {
    const filters: QueryFilters = {
      status,
      category,
      rfpId,
      submittedBy,
      aiProcessed,
      adminReviewed,
      search,
    };

    const pagination: PaginationOptions = {
      page: Number(page),
      pageSize: Number(pageSize),
      sortBy: sortBy || 'submittedAt',
      sortOrder: sortOrder || 'DESC',
    };

    return this.queriesService.findAll(filters, pagination);
  }

  /**
   * Get query statistics
   */
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get query statistics',
    description: 'Retrieve statistics about queries (counts, averages, etc.)',
  })
  @ApiQuery({ name: 'rfpId', required: false, type: String })
  @ApiQuery({ name: 'submittedBy', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: QueryStatisticsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatistics(
    @QueryParam('rfpId') rfpId?: string,
    @QueryParam('submittedBy') submittedBy?: string,
  ): Promise<QueryStatisticsDto> {
    const filters: QueryFilters = { rfpId, submittedBy };
    return this.queriesService.getStatistics(filters);
  }

  /**
   * Get queries by vendor
   */
  @Get('vendor/:vendorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get queries by vendor',
    description: 'Retrieve all queries submitted by a specific vendor',
  })
  @ApiParam({ name: 'vendorId', type: String, description: 'Vendor UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Vendor queries retrieved successfully',
    type: QueryListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByVendor(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @QueryParam('page') page: number = 1,
    @QueryParam('pageSize') pageSize: number = 20,
  ): Promise<QueryListResponseDto> {
    const pagination: PaginationOptions = {
      page: Number(page),
      pageSize: Number(pageSize),
    };
    return this.queriesService.findByVendor(vendorId, pagination);
  }

  /**
   * Get queries by RFP
   */
  @Get('rfp/:rfpId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get queries by RFP',
    description: 'Retrieve all queries for a specific RFP',
  })
  @ApiParam({ name: 'rfpId', type: String, description: 'RFP UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'RFP queries retrieved successfully',
    type: QueryListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByRfp(
    @Param('rfpId', ParseUUIDPipe) rfpId: string,
    @QueryParam('page') page: number = 1,
    @QueryParam('pageSize') pageSize: number = 20,
  ): Promise<QueryListResponseDto> {
    const pagination: PaginationOptions = {
      page: Number(page),
      pageSize: Number(pageSize),
    };
    return this.queriesService.findByRfp(rfpId, pagination);
  }

  /**
   * Bulk update queries (accept/reject/assign)
   */
  @Post('bulk-update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk update queries',
    description: 'Accept, reject, or assign multiple queries in one request',
  })
  @ApiBody({ type: BulkUpdateQueriesDto })
  @ApiResponse({ status: 200, description: 'Bulk update applied' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async bulkUpdate(
    @Body() bulkUpdateQueriesDto: BulkUpdateQueriesDto,
    @Request() req: any,
  ): Promise<{ action: string; updatedCount: number; failedIds: string[]; totalRequested: number }>
  {
    const userId = req.user?.userId || 'test-user-id';
    return this.queriesService.bulkUpdate(bulkUpdateQueriesDto, userId);
  }

  /**
   * Export selected queries as CSV (base64)
   */
  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export queries',
    description: 'Export selected queries as CSV; returns base64-encoded file payload',
  })
  @ApiBody({ type: ExportQueriesDto })
  @ApiResponse({ status: 200, description: 'Export generated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async export(
    @Body() exportQueriesDto: ExportQueriesDto,
  ): Promise<{ fileName: string; contentType: string; data: string; count: number }>
  {
    return this.queriesService.exportQueries(exportQueriesDto);
  }

  /**
   * Get a single query by ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get query by ID',
    description: 'Retrieve a specific query by its ID',
  })
  @ApiParam({ name: 'id', type: String, description: 'Query UUID' })
  @ApiResponse({
    status: 200,
    description: 'Query retrieved successfully',
    type: QueryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Query not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QueryResponseDto> {
    return this.queriesService.findOne(id);
  }

  /**
   * Update a query
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a query',
    description: 'Update query details, status, or responses',
  })
  @ApiParam({ name: 'id', type: String, description: 'Query UUID' })
  @ApiBody({ type: UpdateQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Query updated successfully',
    type: QueryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Query not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateQueryDto: UpdateQueryDto,
    @Request() req: any,
  ): Promise<QueryResponseDto> {
    const userId = req.user?.userId || 'test-user-id';
    return this.queriesService.update(id, updateQueryDto, userId);
  }

  /**
   * Mark query for AI processing
   */
  @Post(':id/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark query for AI processing',
    description: 'Trigger AI processing for a specific query',
  })
  @ApiParam({ name: 'id', type: String, description: 'Query UUID' })
  @ApiResponse({
    status: 200,
    description: 'Query marked for AI processing',
    type: QueryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Query not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markForProcessing(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QueryResponseDto> {
    return this.queriesService.markForAIProcessing(id);
  }

  /**
   * Update query with AI response
   */
  @Post(':id/ai-response')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update query with AI response',
    description: 'Add AI-generated response to a query (typically called by RAG service)',
  })
  @ApiParam({ name: 'id', type: String, description: 'Query UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        aiResponse: { type: 'string' },
        pastRefResponse: { type: 'string' },
        pastResponse: { type: 'string' },
        confidence: { type: 'number' },
        sourceDocuments: { type: 'array', items: { type: 'string' } },
        executionId: { type: 'string' },
      },
      required: ['aiResponse'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'AI response added successfully',
    type: QueryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Query not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateWithAIResponse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      aiResponse: string;
      pastRefResponse?: string;
      pastResponse?: string;
      confidence?: number;
      sourceDocuments?: string[];
      executionId?: string;
    },
  ): Promise<QueryResponseDto> {
    return this.queriesService.updateWithAIResponse(
      id,
      body.aiResponse,
      body.pastRefResponse,
      body.pastResponse,
      body.confidence,
      body.sourceDocuments,
      body.executionId,
    );
  }

  /**
   * Delete a query
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a query',
    description: 'Permanently delete a query (use with caution)',
  })
  @ApiParam({ name: 'id', type: String, description: 'Query UUID' })
  @ApiResponse({ status: 204, description: 'Query deleted successfully' })
  @ApiResponse({ status: 404, description: 'Query not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.queriesService.remove(id);
  }
}
