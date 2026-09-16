import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PrebidQueryService } from './prebid-query.service';
import { ProcessQueryDto } from './dto/process-query.dto';
import { AIResponseDto } from './dto/ai-response.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Pre-bid Query Management')
@Controller('prebid-queries')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
@ApiBearerAuth()
export class PrebidQueryController {
  constructor(
    private readonly prebidQueryService: PrebidQueryService,
  ) {}

  /**
   * Get statistics for pre-bid queries
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get Pre-bid Query Statistics',
    description: 'Retrieve comprehensive statistics for pre-bid queries',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics() {
    return this.prebidQueryService.getStatistics();
  }

  /**
   * Get all pre-bid queries with filters
   */
  @Get()
  @ApiOperation({
    summary: 'Get All Pre-bid Queries',
    description: 'Retrieve list of all pre-bid queries with optional filters',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'under_review', 'answered', 'clarification_needed'] })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'rfpId', required: false })
  @ApiQuery({ name: 'aiProcessed', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Queries retrieved successfully',
  })
  async getQueries(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('rfpId') rfpId?: string,
    @Query('aiProcessed') aiProcessed?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;

    return this.prebidQueryService.getQueries({
      status,
      category,
      rfpId,
      aiProcessed: aiProcessed === 'true' ? true : aiProcessed === 'false' ? false : undefined,
      search,
      page: isNaN(pageNum) ? 1 : pageNum,
      pageSize: isNaN(pageSizeNum) ? 20 : pageSizeNum,
    });
  }

  /**
   * Get filter dropdown options
   */
  @Get('filters')
  @ApiOperation({
    summary: 'Get Filter Options',
    description: 'Retrieve available statuses, categories and RFPs for filter dropdowns',
  })
  @ApiResponse({
    status: 200,
    description: 'Filter options retrieved successfully',
  })
  async getFilters() {
    return this.prebidQueryService.getFilters();
  }

  /**
   * Bulk update status for multiple queries
   */
  @Post('bulk/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk Update Query Status',
    description: 'Update the status of multiple pre-bid queries at once',
  })
  @ApiResponse({
    status: 200,
    description: 'Statuses updated successfully',
  })
  async bulkUpdateStatus(
    @Body('queryIds') queryIds: string[],
    @Body('status') status: string,
  ) {
    return this.prebidQueryService.bulkUpdateStatus(queryIds, status);
  }

  /**
   * Get single query by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get Query by ID',
    description: 'Retrieve a specific pre-bid query by its ID',
  })
  @ApiParam({ name: 'id', type: String, description: 'Query UUID' })
  @ApiResponse({
    status: 200,
    description: 'Query retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Query not found',
  })
  async getQueryById(@Param('id', ParseUUIDPipe) id: string) {
    return this.prebidQueryService.getQueryById(id);
  }

  /**
   * Process query with Chief Engineer Agent (AI)
   */
  @Post(':id/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process Query with AI',
    description: 'Trigger Chief Engineer Agent to process the query',
  })
  @ApiParam({ name: 'id', type: String, description: 'Query UUID' })
  @ApiResponse({
    status: 200,
    description: 'Query processing initiated',
  })
  @ApiResponse({
    status: 404,
    description: 'Query not found',
  })
  async processQuery(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() processDto: ProcessQueryDto,
  ) {
    return this.prebidQueryService.processQuery(id, processDto);
  }

  /**
   * Update query status
   */
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update Query Status',
    description: 'Update the status of a pre-bid query',
  })
  @ApiParam({ name: 'id', type: String, description: 'Query UUID' })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Query not found',
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
  ) {
    return this.prebidQueryService.updateStatus(id, status);
  }

  /**
   * Save admin response
   */
  @Post(':id/admin-response')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save Admin Response',
    description: 'Save or update admin response for a query',
  })
  @ApiParam({ name: 'id', type: String, description: 'Query UUID' })
  @ApiResponse({
    status: 200,
    description: 'Admin response saved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Query not found',
  })
  async saveAdminResponse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() responseDto: AIResponseDto,
  ) {
    return this.prebidQueryService.saveAdminResponse(id, responseDto);
  }

  /**
   * Get query history/audit trail
   */
  @Get(':id/history')
  @ApiOperation({
    summary: 'Get Query History',
    description: 'Retrieve audit trail for a specific query',
  })
  @ApiParam({ name: 'id', type: String, description: 'Query UUID' })
  @ApiResponse({
    status: 200,
    description: 'Query history retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Query not found',
  })
  async getQueryHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.prebidQueryService.getQueryHistory(id);
  }

  /**
   * Get similar queries
   */
  @Get(':id/similar')
  @ApiOperation({
    summary: 'Get Similar Queries',
    description: 'Find similar past queries for reference',
  })
  @ApiParam({ name: 'id', type: String, description: 'Query UUID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiResponse({
    status: 200,
    description: 'Similar queries retrieved successfully',
  })
  async getSimilarQueries(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit: number = 5,
  ) {
    return this.prebidQueryService.getSimilarQueries(id, Number(limit));
  }

  /**
   * Get workflow executions
   */
  @Get('workflow/executions')
  @ApiOperation({
    summary: 'Get Workflow Executions',
    description: 'Retrieve Chief Engineer Agent workflow executions',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Workflow executions retrieved successfully',
  })
  async getWorkflowExecutions(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    return this.prebidQueryService.getWorkflowExecutions({
      page: Number(page),
      pageSize: Number(pageSize),
    });
  }

  /**
   * Get specific workflow execution details
   */
  @Get('workflow/executions/:executionId')
  @ApiOperation({
    summary: 'Get Workflow Execution Details',
    description: 'Retrieve details of a specific workflow execution',
  })
  @ApiParam({ name: 'executionId', type: String, description: 'Execution ID' })
  @ApiResponse({
    status: 200,
    description: 'Workflow execution details retrieved successfully',
  })
  async getWorkflowExecutionDetails(
    @Param('executionId') executionId: string,
  ) {
    return this.prebidQueryService.getWorkflowExecutionDetails(executionId);
  }
}
