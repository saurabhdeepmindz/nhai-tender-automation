import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
  MinLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttachmentDto } from './create-query.dto';

export enum QueryStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  ANSWERED = 'answered',
  CLARIFICATION_NEEDED = 'clarification_needed',
}

export class UpdateQueryDto {
  @ApiProperty({
    description: 'Updated query text',
    required: false,
    minLength: 10,
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  queryText?: string;

  @ApiProperty({
    description: 'Updated status of the query',
    enum: QueryStatus,
    required: false,
    example: QueryStatus.UNDER_REVIEW,
  })
  @IsOptional()
  @IsEnum(QueryStatus)
  status?: QueryStatus;

  @ApiProperty({
    description: 'Priority level',
    enum: ['low', 'medium', 'high'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: string;

  @ApiProperty({
    description: 'Updated attachments',
    type: [AttachmentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @ApiProperty({
    description: 'Admin response to the query',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  adminResponse?: string;

  @ApiProperty({
    description: 'AI-generated response',
    required: false,
  })
  @IsOptional()
  @IsString()
  aiResponse?: string;

  @ApiProperty({
    description: 'Past reference response from similar queries',
    required: false,
  })
  @IsOptional()
  @IsString()
  pastRefResponse?: string;

  @ApiProperty({
    description: 'Past response from historical data',
    required: false,
  })
  @IsOptional()
  @IsString()
  pastResponse?: string;

  @ApiProperty({
    description: 'Confidence score (0-100)',
    required: false,
    example: 85.5,
  })
  @IsOptional()
  confidence?: number;

  @ApiProperty({
    description: 'Source documents used for AI response',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sourceDocuments?: string[];

  @ApiProperty({
    description: 'Execution ID from the RAG service',
    required: false,
  })
  @IsOptional()
  @IsString()
  executionId?: string;

  @ApiProperty({
    description: 'Mark as AI processed',
    required: false,
  })
  @IsOptional()
  aiProcessed?: boolean;

  @ApiProperty({
    description: 'Mark as admin reviewed',
    required: false,
  })
  @IsOptional()
  adminReviewed?: boolean;

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
