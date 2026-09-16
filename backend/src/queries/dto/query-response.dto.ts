import { ApiProperty } from '@nestjs/swagger';
import { QueryCategory } from './create-query.dto';
import { QueryStatus } from './update-query.dto';

export class QueryResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the query',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  queryId: string;

  @ApiProperty({
    description: 'Query number (human-readable)',
    example: 'QRY-2024-0001',
  })
  queryNumber: string;

  @ApiProperty({
    description: 'RFP ID this query relates to',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  rfpId: string;

  @ApiProperty({
    description: 'RFP details (optional nested object)',
    required: false,
  })
  rfp?: {
    rfpNumber: string;
    title: string;
    status: string;
  };

  @ApiProperty({
    description: 'Vendor ID who submitted the query',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  submittedBy: string;

  @ApiProperty({
    description: 'Vendor details (optional nested object)',
    required: false,
  })
  vendor?: {
    vendorId: string;
    companyName: string;
    contactEmail: string;
  };

  @ApiProperty({
    description: 'Category of the query',
    enum: QueryCategory,
    example: QueryCategory.TECHNICAL,
  })
  category: QueryCategory;

  @ApiProperty({
    description: 'The query text',
    example: 'What is the minimum experience required for the project?',
  })
  queryText: string;

  @ApiProperty({
    description: 'Attachments associated with the query',
    required: false,
    type: 'array',
  })
  attachments?: any[];

  @ApiProperty({
    description: 'Current status of the query',
    enum: QueryStatus,
    example: QueryStatus.PENDING,
  })
  status: QueryStatus;

  @ApiProperty({
    description: 'Priority level',
    example: 'medium',
    required: false,
  })
  priority?: string;

  @ApiProperty({
    description: 'Whether AI has processed this query',
    example: false,
  })
  aiProcessed: boolean;

  @ApiProperty({
    description: 'Whether admin has reviewed this query',
    example: false,
  })
  adminReviewed: boolean;

  @ApiProperty({
    description: 'Submission timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  submittedAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T14:20:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Response timestamp (when answered)',
    required: false,
    example: '2024-01-16T09:15:00Z',
  })
  respondedAt?: Date;

  @ApiProperty({
    description: 'AI-generated response',
    required: false,
  })
  aiResponse?: string;

  @ApiProperty({
    description: 'Past reference response',
    required: false,
  })
  pastRefResponse?: string;

  @ApiProperty({
    description: 'Past response from historical data',
    required: false,
  })
  pastResponse?: string;

  @ApiProperty({
    description: 'Admin response',
    required: false,
  })
  adminResponse?: string;

  @ApiProperty({
    description: 'Confidence score (0-100)',
    required: false,
    example: 85.5,
  })
  confidence?: number;

  @ApiProperty({
    description: 'Source documents referenced',
    required: false,
    type: [String],
  })
  sourceDocuments?: string[];

  @ApiProperty({
    description: 'RAG execution ID',
    required: false,
  })
  executionId?: string;

  @ApiProperty({
    description: 'Processing timestamp',
    required: false,
  })
  processedAt?: Date;

  @ApiProperty({
    description: 'Answered timestamp',
    required: false,
  })
  answeredAt?: Date;

  @ApiProperty({
    description: 'User ID who answered',
    required: false,
  })
  answeredBy?: string;

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
  })
  metadata?: Record<string, any>;
}

export class QueryListResponseDto {
  @ApiProperty({
    description: 'List of queries',
    type: [QueryResponseDto],
  })
  queries: QueryResponseDto[];

  @ApiProperty({
    description: 'Total count of queries',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Page size',
    example: 20,
  })
  pageSize: number;

  @ApiProperty({
    description: 'Total pages',
    example: 8,
  })
  totalPages: number;
}

export class QueryStatisticsDto {
  @ApiProperty({
    description: 'Total number of queries',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Number of pending queries',
    example: 45,
  })
  pending: number;

  @ApiProperty({
    description: 'Number of queries under review',
    example: 30,
  })
  underReview: number;

  @ApiProperty({
    description: 'Number of answered queries',
    example: 70,
  })
  answered: number;

  @ApiProperty({
    description: 'Number of queries needing clarification',
    example: 5,
  })
  clarificationNeeded: number;

  @ApiProperty({
    description: 'Number of AI processed queries',
    example: 100,
  })
  aiProcessed: number;

  @ApiProperty({
    description: 'Average response time in hours',
    example: 24,
  })
  avgResponseTime: number;

  @ApiProperty({
    description: 'Average confidence score',
    example: 82.5,
  })
  avgConfidence: number;
}
