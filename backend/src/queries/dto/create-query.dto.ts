import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  MaxLength,
  MinLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum QueryCategory {
  TECHNICAL = 'technical',
  COMMERCIAL = 'commercial',
  ELIGIBILITY = 'eligibility',
  CONTRACTUAL = 'contractual',
  GENERAL = 'general',
}

export class AttachmentDto {
  @ApiProperty({
    description: 'Name of the attachment file',
    example: 'technical_query_doc.pdf',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1048576,
  })
  @IsNotEmpty()
  fileSize: number;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf',
  })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({
    description: 'Storage path or URL of the file',
    example: '/uploads/queries/2024/01/abc123-technical_query_doc.pdf',
  })
  @IsString()
  @IsNotEmpty()
  filePath: string;
}

export class CreateQueryDto {
  @ApiProperty({
    description: 'UUID of the RFP this query relates to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  rfpId: string;

  @ApiProperty({
    description: 'Category of the query',
    enum: QueryCategory,
    example: QueryCategory.TECHNICAL,
  })
  @IsEnum(QueryCategory)
  @IsNotEmpty()
  category: QueryCategory;

  @ApiProperty({
    description: 'The actual query text from the vendor',
    example: 'What is the minimum experience required for the project?',
    minLength: 10,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Query text must be at least 10 characters long' })
  @MaxLength(5000, { message: 'Query text cannot exceed 5000 characters' })
  queryText: string;

  @ApiProperty({
    description: 'Optional attachments for the query',
    type: [AttachmentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @ApiProperty({
    description: 'Priority level (optional)',
    enum: ['low', 'medium', 'high'],
    required: false,
    example: 'medium',
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: string;

  @ApiProperty({
    description: 'Additional metadata (optional)',
    required: false,
    example: { source: 'web', device: 'desktop' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
