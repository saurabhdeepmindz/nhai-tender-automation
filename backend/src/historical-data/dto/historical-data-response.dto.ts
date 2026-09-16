import { ApiProperty } from '@nestjs/swagger';
import { HistoricalDataType, UploadStatus } from './upload-historical-data.dto';

export class HistoricalDataResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'RFP-2023-NH-145' })
  rfpNumber: string;

  @ApiProperty({ example: 'Mumbai-Pune Expressway Project' })
  title: string;

  @ApiProperty({ enum: HistoricalDataType, example: HistoricalDataType.RFP })
  type: HistoricalDataType;

  @ApiProperty({ example: '/uploads/rfp-2023-nh-145.pdf' })
  filePath: string;

  @ApiProperty({ example: 18500000 })
  fileSize: number;

  @ApiProperty({ example: 'RFP-2023-NH-145.pdf' })
  originalFilename: string;

  @ApiProperty({ example: 'application/pdf' })
  mimeType: string;

  @ApiProperty({ enum: UploadStatus, example: UploadStatus.COMPLETED })
  status: UploadStatus;

  @ApiProperty({ example: 0 })
  aiReferences: number;

  @ApiProperty({ example: 85.5 })
  accuracyPercentage: number;

  @ApiProperty({ example: '2026-01-16T10:30:00Z' })
  uploadDate: Date;

  @ApiProperty({ example: '2026-01-16T10:35:00Z' })
  lastUsed: Date;

  @ApiProperty({ example: { year: 2023, region: 'Western' } })
  metadata: Record<string, any>;

  @ApiProperty({ example: 'Highway Construction' })
  category: string;

  @ApiProperty({ example: 1 })
  uploadedBy: number;
}

export class StatisticsCardDto {
  @ApiProperty({ example: 'Historical Data' })
  title: string;

  @ApiProperty({ example: 145 })
  count: number;

  @ApiProperty({
    example: { RFPs: 50, 'Q&A': 75, Corrigenda: 20 },
    description: 'Breakdown by type',
  })
  breakdown?: Record<string, number>;

  @ApiProperty({ example: 85.5, required: false })
  accuracyPercentage?: number;

  @ApiProperty({ example: 234, required: false })
  monthlyReferences?: number;
}

export class DashboardStatisticsResponseDto {
  @ApiProperty({ type: StatisticsCardDto })
  historicalData: StatisticsCardDto;

  @ApiProperty({ type: StatisticsCardDto })
  liveData: StatisticsCardDto;

  @ApiProperty({ type: StatisticsCardDto })
  totalKnowledgeBase: StatisticsCardDto;

  @ApiProperty({ type: StatisticsCardDto })
  aiReferencesUsed: StatisticsCardDto;
}

export class MostReferencedItemDto {
  @ApiProperty({ example: 'RFP-2023-NH-145' })
  rfpNumber: string;

  @ApiProperty({ example: 'Mumbai-Pune Expressway Project' })
  title: string;

  @ApiProperty({ enum: HistoricalDataType, example: HistoricalDataType.RFP })
  type: HistoricalDataType;

  @ApiProperty({ example: 125 })
  referenceCount: number;

  @ApiProperty({ example: 92.5 })
  accuracyPercentage: number;

  @ApiProperty({ example: '2026-01-15T14:30:00Z' })
  lastUsed: Date;

  @ApiProperty({ example: '2024-12-01T10:00:00Z' })
  uploadDate: Date;

  @ApiProperty({ example: '📁 Complete Package' })
  packageType: string;
}

export class UploadHistoryItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Bulk Upload: Historical Pre-Bid Q&A Dataset' })
  title: string;

  @ApiProperty({ example: 'Uploaded 45 Q&A documents from 2022-2023 highway projects' })
  description: string;

  @ApiProperty({ example: '2026-01-16T08:30:00Z' })
  uploadTime: Date;

  @ApiProperty({ example: 'Admin User' })
  uploadedBy: string;

  @ApiProperty({ example: 45 })
  fileCount: number;

  @ApiProperty({ example: 127000000 })
  totalSize: number;

  @ApiProperty({ example: 100 })
  successRate: number;

  @ApiProperty({ example: 'BULK' })
  uploadType: string;
}

export class PaginatedHistoricalDataResponseDto {
  @ApiProperty({ type: [HistoricalDataResponseDto] })
  data: HistoricalDataResponseDto[];

  @ApiProperty({ example: 145 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 8 })
  totalPages: number;
}

export class UploadResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'File uploaded successfully' })
  message: string;

  @ApiProperty({ type: HistoricalDataResponseDto })
  data?: HistoricalDataResponseDto;

  @ApiProperty({ example: null, required: false })
  error?: string;
}

export class BulkUploadResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Bulk upload completed' })
  message: string;

  @ApiProperty({ example: 45 })
  totalUploaded: number;

  @ApiProperty({ example: 45 })
  successCount: number;

  @ApiProperty({ example: 0 })
  failureCount: number;

  @ApiProperty({ type: [HistoricalDataResponseDto] })
  uploadedItems: HistoricalDataResponseDto[];

  @ApiProperty({ type: [String], required: false })
  errors?: string[];
}

export class AIReferenceUpdateDto {
  @ApiProperty({ example: 1 })
  historicalDataId: number;

  @ApiProperty({ example: 'RFP-2023-NH-145' })
  rfpNumber: string;

  @ApiProperty({ example: 'Query about technical specifications' })
  queryContext: string;

  @ApiProperty({ example: 95.5 })
  accuracyScore: number;

  @ApiProperty({ example: '2026-01-16T10:45:00Z' })
  referenceTime: Date;
}
