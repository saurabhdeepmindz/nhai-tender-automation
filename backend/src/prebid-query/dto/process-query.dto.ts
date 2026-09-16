import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
} from 'class-validator';

export class ProcessQueryDto {
  @ApiProperty({
    description: 'Query ID from the database',
    example: 'q-uuid-123',
  })
  @IsNotEmpty()
  @IsString()
  queryId: string;

  @ApiProperty({
    description: 'Query text from vendor',
    example: 'What is the EMD requirement for this project?',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  queryText: string;

  @ApiPropertyOptional({
    description: 'RFP context information',
    example: {
      rfpId: 'rfp-uuid-456',
      rfpNumber: 'RFP-2024-NH-001',
      category: 'Commercial',
    },
  })
  @IsOptional()
  @IsObject()
  rfpContext?: {
    rfpId?: string;
    rfpNumber?: string;
    category?: string;
    [key: string]: any;
  };

  @ApiPropertyOptional({
    description: 'Whether to use historical data in processing',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  useHistoricalData?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to search for similar past queries',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  searchSimilarQueries?: boolean;

  @ApiPropertyOptional({
    description: 'Number of similar queries to retrieve',
    example: 5,
    default: 5,
  })
  @IsOptional()
  topK?: number;

  @ApiPropertyOptional({
    description: 'Minimum confidence threshold (0-100)',
    example: 70,
    default: 70,
  })
  @IsOptional()
  minConfidence?: number;

  @ApiPropertyOptional({
    description: 'Additional processing options',
  })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}
