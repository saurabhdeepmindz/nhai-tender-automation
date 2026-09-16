import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { HistoricalDataService } from './historical-data.service';
import { UploadDataDto } from './dto/upload-data.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Historical Data Management')
@Controller('historical-data')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
@ApiBearerAuth()
export class HistoricalDataController {
  constructor(
    private readonly historicalDataService: HistoricalDataService,
  ) {}

  /**
   * Get statistics for historical data
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get Historical Data Statistics',
    description: 'Retrieve statistics including counts, processing status, and AI usage',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics() {
    return this.historicalDataService.getStatistics();
  }

  /**
   * Get all historical documents with filters
   */
  @Get('documents')
  @ApiOperation({
    summary: 'Get All Historical Documents',
    description: 'Retrieve list of all historical documents with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
  })
  async getDocuments(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('rfpNumber') rfpNumber?: string,
    @Query('year') year?: number,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    return this.historicalDataService.getDocuments({
      type,
      status,
      rfpNumber,
      year,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  }

  /**
   * Get single document by ID
   */
  @Get('documents/:id')
  @ApiOperation({
    summary: 'Get Document by ID',
    description: 'Retrieve a specific historical document by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async getDocumentById(@Param('id', ParseUUIDPipe) id: string) {
    return this.historicalDataService.getDocumentById(id);
  }

  /**
   * Upload single historical document
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload Historical Document',
    description: 'Upload a single RFP, Q&A, or Corrigendum document',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        documentType: {
          type: 'string',
          enum: ['rfp', 'qa', 'corrigendum'],
        },
        rfpNumber: {
          type: 'string',
        },
        title: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
      },
      required: ['file', 'documentType'],
    },
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'file', maxCount: 1 }]))
  async uploadDocument(
    @UploadedFiles() files: { file?: Express.Multer.File[] },
    @Body() uploadDto: UploadDataDto,
  ) {
    const file = files.file?.[0];
    if (!file) {
      throw new Error('No file uploaded');
    }

    return this.historicalDataService.uploadDocument(file, uploadDto);
  }

  /**
   * Bulk upload historical documents
   */
  @Post('upload/bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Bulk Upload Historical Documents',
    description: 'Upload multiple documents at once (supports ZIP files)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        documentType: {
          type: 'string',
          enum: ['rfp', 'qa', 'corrigendum'],
        },
      },
      required: ['files', 'documentType'],
    },
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 100 }]))
  async bulkUploadDocuments(
    @UploadedFiles() files: { files?: Express.Multer.File[] },
    @Body() uploadDto: UploadDataDto,
  ) {
    const uploadedFiles = files.files || [];
    if (uploadedFiles.length === 0) {
      throw new Error('No files uploaded');
    }

    return this.historicalDataService.bulkUploadDocuments(uploadedFiles, uploadDto);
  }

  /**
   * Get upload history
   */
  @Get('upload-history')
  @ApiOperation({
    summary: 'Get Upload History',
    description: 'Retrieve chronological list of all uploads',
  })
  @ApiResponse({
    status: 200,
    description: 'Upload history retrieved successfully',
  })
  async getUploadHistory(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    return this.historicalDataService.getUploadHistory({
      page: Number(page),
      pageSize: Number(pageSize),
    });
  }

  /**
   * Get most referenced documents
   */
  @Get('most-referenced')
  @ApiOperation({
    summary: 'Get Most Referenced Documents',
    description: 'Retrieve top documents by AI reference count',
  })
  @ApiResponse({
    status: 200,
    description: 'Most referenced documents retrieved successfully',
  })
  async getMostReferencedDocuments(@Query('limit') limit: number = 25) {
    return this.historicalDataService.getMostReferencedDocuments(Number(limit));
  }

  /**
   * Reprocess a document (re-vectorize)
   */
  @Post('documents/:id/reprocess')
  @ApiOperation({
    summary: 'Reprocess Document',
    description: 'Re-vectorize and re-index a document in the vector store',
  })
  @ApiResponse({
    status: 200,
    description: 'Document reprocessed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async reprocessDocument(@Param('id', ParseUUIDPipe) id: string) {
    return this.historicalDataService.reprocessDocument(id);
  }

  /**
   * Delete a document
   */
  @Delete('documents/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete Document',
    description: 'Delete a historical document and its vector embeddings',
  })
  @ApiResponse({
    status: 204,
    description: 'Document deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async deleteDocument(@Param('id', ParseUUIDPipe) id: string) {
    return this.historicalDataService.deleteDocument(id);
  }

  /**
   * Search historical documents (semantic search)
   */
  @Post('search')
  @ApiOperation({
    summary: 'Search Historical Documents',
    description: 'Perform semantic search over historical documents',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query text',
        },
        topK: {
          type: 'number',
          description: 'Number of results to return',
          default: 5,
        },
        documentType: {
          type: 'string',
          enum: ['rfp', 'qa', 'corrigendum', 'all'],
          default: 'all',
        },
      },
      required: ['query'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  async searchDocuments(
    @Body('query') query: string,
    @Body('topK') topK: number = 5,
    @Body('documentType') documentType: string = 'all',
  ) {
    return this.historicalDataService.searchDocuments(query, topK, documentType);
  }

  /**
   * Get RAG configuration
   */
  @Get('rag-config')
  @ApiOperation({
    summary: 'Get RAG Configuration',
    description: 'Retrieve current RAG service configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration retrieved successfully',
  })
  async getRAGConfig() {
    return this.historicalDataService.getRAGConfig();
  }

  /**
   * Update RAG configuration
   */
  @Post('rag-config')
  @ApiOperation({
    summary: 'Update RAG Configuration',
    description: 'Update RAG service configuration settings',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        embeddingModel: { type: 'string' },
        chunkSize: { type: 'number' },
        chunkOverlap: { type: 'number' },
        topK: { type: 'number' },
        similarityThreshold: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated successfully',
  })
  async updateRAGConfig(@Body() config: Record<string, any>) {
    return this.historicalDataService.updateRAGConfig(config);
  }

  /**
   * Get RAG transactions/logs
   */
  @Get('rag-transactions')
  @ApiOperation({
    summary: 'Get RAG Transactions',
    description: 'Retrieve RAG service transaction logs',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  async getRAGTransactions(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('status') status?: string,
  ) {
    return this.historicalDataService.getRAGTransactions({
      page: Number(page),
      pageSize: Number(pageSize),
      status,
    });
  }
}
