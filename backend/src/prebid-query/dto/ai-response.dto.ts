import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class AIResponseDto {
  @ApiProperty({
    description: 'Final admin-approved response text',
    example: 'The EMD requirement for this project is 2% of the estimated contract value...',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(10000)
  response: string;

  @ApiPropertyOptional({
    description: 'AI-generated response (before admin review)',
    example: 'Based on the RFP document Section 3.2, the EMD requirement...',
  })
  @IsOptional()
  @IsString()
  aiResponse?: string;

  @ApiPropertyOptional({
    description: 'Reference to similar past query',
    example: 'In RFP-2023-NH-045, a similar query was answered...',
  })
  @IsOptional()
  @IsString()
  pastRefResponse?: string;

  @ApiPropertyOptional({
    description: 'Historical response from past query',
    example: 'The EMD is typically 2% for highway projects...',
  })
  @IsOptional()
  @IsString()
  pastResponse?: string;

  @ApiPropertyOptional({
    description: 'AI confidence score (0-100)',
    example: 87.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence?: number;

  @ApiPropertyOptional({
    description: 'Source documents used for the response',
    example: ['RFP-2024-NH-001-Section-3.2', 'Policy-EMD-2024'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sourceDocuments?: string[];

  @ApiPropertyOptional({
    description: 'Execution ID from Chief Engineer Agent workflow',
    example: 'exec-uuid-789',
  })
  @IsOptional()
  @IsString()
  executionId?: string;

  @ApiPropertyOptional({
    description: 'User ID who provided/approved the response',
    example: 'user-uuid-admin-123',
  })
  @IsOptional()
  @IsString()
  answeredBy?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
