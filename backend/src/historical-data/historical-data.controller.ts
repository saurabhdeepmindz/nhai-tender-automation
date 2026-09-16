/**
 * NHAI Tender Query Automation System
 * Historical + Live Data Controller
 * 
 * Purpose:
 * - Handle document uploads with file processing (Historical + Live)
 * - Queue documents for background vectorization
 * - Provide status tracking and statistics
 * - Support retry for failed documents
 * 
 * File: backend/src/historical-data/historical-data.controller.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  Query,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { HistoricalDataService } from './historical-data.service';
import {
  UploadHistoricalDataDto,
  ProcessDocumentResponseDto,
  DocumentStatusResponseDto,
  DocumentsListResponseDto,
  StatisticsResponseDto,
  EnhancedDocumentDetailsResponseDto,
  EnhancedDocumentsListResponseDto,
  DeleteDocumentResponseDto,
  EnhancedStatisticsResponseDto,
  PaginationQueryDto,
  UploadHistoryResponseDto,
  HistoricalDataFilterDto,
  HistoricalDataListResponseDto,
} from './dto/upload-historical-data.dto';
import {
  QueryDocumentDto,
  QueryDocumentResponseDto,
} from './dto/query-document.dto';

// Ensure upload directory exists
const uploadDir = './uploads/historical';
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@ApiTags('Historical & Live Data Management')
@Controller('historical-data')
export class HistoricalDataController {
  constructor(private readonly historicalDataService: HistoricalDataService) {}

  /**
   * Upload historical document (RFP, Q&A, Corrigendum)
   * File is saved and queued for background processing
   */
  @Post('upload')
  @ApiOperation({
    summary: 'Upload historical or live document',
    description: 'Used for both Historical and Live uploads (Live Data tab). Upload RFP, Q&A, or Corrigendum document for vectorization and storage.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file (PDF, DOCX, CSV, XLSX)',
        },
        rfp_number: {
          type: 'string',
          example: 'RFP-2024-NH-001',
        },
        title: {
          type: 'string',
          example: 'Mumbai-Pune Expressway Development',
        },
        document_type: {
          type: 'string',
          enum: ['RFP', 'Q&A', 'CORRIGENDUM'],
          example: 'RFP',
        },
        description: {
          type: 'string',
          example: 'Historical RFP for reference',
        },
      },
      required: ['file', 'rfp_number', 'title', 'document_type'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded and queued for processing',
    type: ProcessDocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or missing required fields',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 52428800, // 50MB
      },
      fileFilter: (req, file, cb) => {
        const allowedExts = /\.(pdf|docx|csv|xlsx)$/i;
        if (allowedExts.test(extname(file.originalname))) {
          cb(null, true);
        } else {
          cb(
            new HttpException(
              'Only PDF, DOCX, CSV, and XLSX files are allowed',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadHistoricalDataDto,
  ): Promise<ProcessDocumentResponseDto> {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    return this.historicalDataService.processUpload(file, uploadDto);
  }


  /**
   * Get all documents with optional filters and pagination
   */
  @Get()
  @ApiOperation({
    summary: 'Get all documents with enhanced pagination',
    description: 'Retrieve list of all documents (Historical + Live) with pagination, sorting, and filtering support',
  })
  @ApiResponse({
    status: 200,
    description: 'Documents list retrieved with pagination',
    type: EnhancedDocumentsListResponseDto,
  })
  async getAllDocuments(
    @Query() paginationDto: PaginationQueryDto,
  ): Promise<EnhancedDocumentsListResponseDto> {
    return this.historicalDataService.getAllDocumentsEnhanced(paginationDto);
  }

  /**
   * Get statistics summary (must be before :id route)
   */
  @Get('stats/summary')
  @ApiOperation({
    summary: 'Get enhanced statistics',
    description: 'Retrieve comprehensive statistics about all uploaded documents (Historical + Live)',
  })
  @ApiResponse({
    status: 200,
    description: 'Enhanced statistics retrieved',
    type: EnhancedStatisticsResponseDto,
  })
  async getStatistics(): Promise<EnhancedStatisticsResponseDto> {
    return this.historicalDataService.getStatisticsEnhanced();
  }

  /**
   * Get documents from closed/awarded RFPs (must be before :id route)
   */
  @Get('historical')
  @ApiOperation({
    summary: 'Get historical documents',
    description: 'Documents whose linked RFP is closed/awarded (or has no linked RFP at all)',
  })
  @ApiResponse({ status: 200, description: 'Historical documents retrieved', type: HistoricalDataListResponseDto })
  async getHistoricalDataList(
    @Query() filters: HistoricalDataFilterDto,
  ): Promise<HistoricalDataListResponseDto> {
    return this.historicalDataService.getHistoricalData(filters);
  }

  /**
   * Get documents from RFPs still open for bidding (must be before :id route)
   */
  @Get('live')
  @ApiOperation({
    summary: 'Get live documents',
    description: 'Documents whose linked RFP is still open for bidding',
  })
  @ApiResponse({ status: 200, description: 'Live documents retrieved', type: HistoricalDataListResponseDto })
  async getLiveDataList(
    @Query() filters: HistoricalDataFilterDto,
  ): Promise<HistoricalDataListResponseDto> {
    return this.historicalDataService.getLiveData(filters);
  }

  /**
   * Get upload history (must be before :id route)
   */
  @Get('upload-history')
  @ApiOperation({
    summary: 'Get upload history',
    description: 'Retrieve a paginated history of uploaded documents, most recent first',
  })
  @ApiResponse({
    status: 200,
    description: 'Upload history retrieved',
    type: UploadHistoryResponseDto,
  })
  async getUploadHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<UploadHistoryResponseDto> {
    return this.historicalDataService.getUploadHistory(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * Get document details by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get document details with statistics',
    description: 'Retrieve processing status, metadata, and detailed statistics for a specific document (Historical + Live)',
  })
  @ApiResponse({
    status: 200,
    description: 'Document details with statistics retrieved',
    type: EnhancedDocumentDetailsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async getDocumentStatus(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EnhancedDocumentDetailsResponseDto> {
    return this.historicalDataService.getDocumentStatusEnhanced(id);
  }

  /**
   * Retry failed document processing
   */
  @Post(':id/retry')
  @ApiOperation({
    summary: 'Retry failed processing',
    description: 'Requeue a failed document for processing (Historical + Live)',
  })
  @ApiResponse({
    status: 200,
    description: 'Document requeued successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Document is not in failed status',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async retryProcessing(@Param('id', ParseIntPipe) id: number) {
    return this.historicalDataService.retryProcessing(id);
  }

  /**
   * Query a processed document with a question
   */
  @Post(':id/query')
  @ApiOperation({
    summary: 'Query document',
    description: 'Ask a question about a processed document (Historical + Live) and get an AI-generated answer',
  })
  @ApiResponse({
    status: 200,
    description: 'Query successful',
    type: QueryDocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Document not yet processed or invalid question',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async queryDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() queryDto: QueryDocumentDto,
  ): Promise<QueryDocumentResponseDto> {
    return this.historicalDataService.queryDocument(id, queryDto.question);
  }

  /**
   * Delete a document and cleanup all associated data
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete document',
    description: 'Delete a document (Historical + Live) and cleanup all associated data including vectors, uploads, and database records',
  })
  @ApiResponse({
    status: 200,
    description: 'Document deleted successfully',
    type: DeleteDocumentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Error during deletion',
  })
  async deleteDocument(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteDocumentResponseDto> {
    return this.historicalDataService.deleteDocument(id);
  }
}
