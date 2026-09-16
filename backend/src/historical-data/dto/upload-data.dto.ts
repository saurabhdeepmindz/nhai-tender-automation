import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsString,
  IsOptional,
  MaxLength,
  IsObject,
} from 'class-validator';

export enum DocumentType {
  RFP = 'rfp',
  QA = 'qa',
  CORRIGENDUM = 'corrigendum',
}

export class UploadDataDto {
  @ApiProperty({
    description: 'Type of document being uploaded',
    enum: DocumentType,
    example: DocumentType.RFP,
  })
  @IsNotEmpty()
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({
    description: 'RFP number (if applicable)',
    example: 'RFP-2024-NH-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  rfpNumber?: string;

  @ApiProperty({
    description: 'Document title',
    example: 'Highway Construction Project - Phase 1',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiProperty({
    description: 'Document description',
    example: 'Complete RFP package for highway construction project',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'User ID who uploaded the document',
    example: 'user-uuid-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  uploadedBy?: string;

  @ApiProperty({
    description: 'Additional metadata (JSON object)',
    example: { year: 2024, region: 'North', category: 'Highway' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
