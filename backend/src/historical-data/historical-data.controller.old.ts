import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from './stub-roles.decorator';
// import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HistoricalDataService } from './historical-data.service';
import {
  UploadHistoricalDataDto,
  BulkUploadDto,
  UpdateHistoricalDataDto,
  QueryHistoricalDataDto,
} from './dtos/upload-historical-data.dto';
import {
  HistoricalDataResponseDto,
  DashboardStatisticsResponseDto,
  MostReferencedItemDto,
  PaginatedHistoricalDataResponseDto,
  UploadResponseDto,
  BulkUploadResponseDto,
  AIReferenceUpdateDto,
} from './dtos/historical-data-response.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Historical Data Management')
@Controller('api/historical-data')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @ApiBearerAuth()
export class HistoricalDataController {
  constructor(private readonly historicalDataService: HistoricalDataService) {}

  /**
   * Get dashboard statistics (4 cards)
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Retrieve statistics for Historical Data, Live Data, Total Knowledge Base, and AI References',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: DashboardStatisticsResponseDto,
  })
  async getDashboardStatistics(): Promise<DashboardStatisticsResponseDto> {
    return await this.historicalDataService.getDashboardStatistics();
  }

  /**
   * Upload single historical data document
   */
  @Post('upload')
  @Roles('admin', 'chief_engineer')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/historical-data',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
        }
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload single historical data document',
    description: 'Upload RFP, Q&A, or Corrigendum document',
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
        rfpNumber: { type: 'string' },
        title: { type: 'string' },
        type: { type: 'string', enum: ['RFP', 'Q&A', 'CORRIGENDUM'] },
        category: { type: 'string' },
        metadata: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: UploadResponseDto,
  })
  async uploadHistoricalData(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadHistoricalDataDto,
    @CurrentUser() user: any,
  ): Promise<UploadResponseDto> {
    // Add file information to DTO
    if (file) {
      dto.filePath = file.path;
      dto.fileSize = file.size;
      dto.originalFilename = file.originalname;
      dto.mimeType = file.mimetype;
    }

    return await this.historicalDataService.uploadHistoricalData(dto, user.id);
  }

  /**
   * Bulk upload historical data
   */
  @Post('bulk-upload')
  @Roles('admin', 'chief_engineer')
  @UseInterceptors(
    FilesInterceptor('files', 100, {
      storage: diskStorage({
        destination: './uploads/historical-data',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
      },
    }),
  )
  @ApiOperation({
    summary: 'Bulk upload historical data',
    description: 'Upload multiple documents at once',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Bulk upload completed',
    type: BulkUploadResponseDto,
  })
  async bulkUploadHistoricalData(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: BulkUploadDto,
    @CurrentUser() user: any,
  ): Promise<BulkUploadResponseDto> {
    // Match files with document entries
    if (files && files.length > 0) {
      files.forEach((file, index) => {
        if (dto.documents[index]) {
          dto.documents[index].filePath = file.path;
          dto.documents[index].fileSize = file.size;
          dto.documents[index].originalFilename = file.originalname;
          dto.documents[index].mimeType = file.mimetype;
        }
      });
    }

    return await this.historicalDataService.bulkUploadHistoricalData(dto, user.id);
  }

  /**
   * Get historical data with filters and pagination (Tab 1)
   */
  @Get('historical')
  @ApiOperation({
    summary: 'Get historical data list',
    description: 'Retrieve historical data (pre go-live) with filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical data retrieved successfully',
    type: PaginatedHistoricalDataResponseDto,
  })
  async getHistoricalData(
    @Query() query: QueryHistoricalDataDto,
  ): Promise<PaginatedHistoricalDataResponseDto> {
    return await this.historicalDataService.getHistoricalData(query);
  }

  /**
   * Get live data (Tab 2)
   */
  @Get('live')
  @ApiOperation({
    summary: 'Get live data list',
    description: 'Retrieve live data (post go-live) with filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Live data retrieved successfully',
    type: PaginatedHistoricalDataResponseDto,
  })
  async getLiveData(
    @Query() query: QueryHistoricalDataDto,
  ): Promise<PaginatedHistoricalDataResponseDto> {
    return await this.historicalDataService.getLiveData(query);
  }

  /**
   * Get most referenced documents (Tab 3)
   */
  @Get('most-referenced')
  @ApiOperation({
    summary: 'Get most referenced documents',
    description: 'Retrieve top 25 documents by AI reference count',
  })
  @ApiResponse({
    status: 200,
    description: 'Most referenced documents retrieved successfully',
    type: [MostReferencedItemDto],
  })
  async getMostReferenced(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<MostReferencedItemDto[]> {
    return await this.historicalDataService.getMostReferenced(limit || 25);
  }

  /**
   * Get upload history (Tab 4)
   */
  @Get('upload-history')
  @ApiOperation({
    summary: 'Get upload history',
    description: 'Retrieve chronological list of all uploads',
  })
  @ApiResponse({
    status: 200,
    description: 'Upload history retrieved successfully',
  })
  async getUploadHistory(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return await this.historicalDataService.getUploadHistory(page || 1, limit || 20);
  }

  /**
   * Get single historical data by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get historical data by ID',
    description: 'Retrieve detailed information about a specific historical data entry',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical data retrieved successfully',
    type: HistoricalDataResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Historical data not found',
  })
  async getHistoricalDataById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<HistoricalDataResponseDto> {
    return await this.historicalDataService.getHistoricalDataById(id);
  }

  /**
   * Update historical data
   */
  @Put(':id')
  @Roles('admin', 'chief_engineer')
  @ApiOperation({
    summary: 'Update historical data',
    description: 'Update metadata, status, or other fields of historical data',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical data updated successfully',
    type: HistoricalDataResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Historical data not found',
  })
  async updateHistoricalData(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHistoricalDataDto,
  ): Promise<HistoricalDataResponseDto> {
    return await this.historicalDataService.updateHistoricalData(id, dto);
  }

  /**
   * Delete historical data (soft delete)
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete historical data',
    description: 'Soft delete historical data entry (admin only)',
  })
  @ApiResponse({
    status: 204,
    description: 'Historical data deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Historical data not found',
  })
  async deleteHistoricalData(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.historicalDataService.deleteHistoricalData(id);
  }

  /**
   * Track AI reference usage
   */
  @Post('ai-reference')
  @ApiOperation({
    summary: 'Track AI reference usage',
    description:
      'Record when AI uses a historical document for generating responses (internal use)',
  })
  @ApiResponse({
    status: 201,
    description: 'AI reference tracked successfully',
  })
  async trackAIReference(@Body() dto: AIReferenceUpdateDto): Promise<{ message: string }> {
    await this.historicalDataService.trackAIReference(dto);
    return { message: 'AI reference tracked successfully' };
  }

  /**
   * Download template for bulk CSV upload
   */
  @Get('templates/bulk-csv')
  @ApiOperation({
    summary: 'Download CSV template',
    description: 'Download template CSV file for bulk Q&A upload',
  })
  @ApiResponse({
    status: 200,
    description: 'Template downloaded successfully',
  })
  async downloadBulkTemplate() {
    // In production, return actual file
    const template = {
      headers: ['RFP_Number', 'Query_ID', 'Category', 'Query', 'Response', 'Date'],
      example: [
        'RFP-2023-145',
        'Q001',
        'Technical',
        'Query text',
        'Response text',
        '2023-05-10',
      ],
    };

    return {
      message: 'Template structure',
      template,
      instructions: [
        'Use CSV format with comma separator',
        'Include all columns in the header row',
        'Date format: YYYY-MM-DD',
        'Category options: Technical, Commercial, Legal, Eligibility',
      ],
    };
  }

  /**
   * Get available years for filtering
   */
  @Get('filters/years')
  @ApiOperation({
    summary: 'Get available years',
    description: 'Get list of years that have historical data for filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Years retrieved successfully',
  })
  async getAvailableYears(): Promise<{ years: number[] }> {
    // This would query distinct years from the database
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    return { years };
  }
}
