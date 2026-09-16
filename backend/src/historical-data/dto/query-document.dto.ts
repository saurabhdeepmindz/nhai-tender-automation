import { IsString, IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for querying a processed historical document
 */
export class QueryDocumentDto {
  @ApiProperty({
    description: 'Question to ask about the document',
    example: 'What is the project timeline?',
  })
  @IsString()
  @IsNotEmpty()
  question: string;
}

/**
 * Source information from vector database
 */
export class QuerySource {
  @ApiProperty({
    description: 'Chunk content from the document',
  })
  content: string;

  @ApiProperty({
    description: 'Metadata about the source chunk',
  })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Similarity score (0-1)',
    example: 0.85,
  })
  similarity: number;
}

/**
 * Response from document query
 */
export class QueryDocumentResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Document ID that was queried',
    example: 12,
  })
  document_id: number;

  @ApiProperty({
    description: 'Original question',
    example: 'What is the project timeline?',
  })
  question: string;

  @ApiProperty({
    description: 'AI-generated answer based on document context',
    example: 'Based on the RFP document, the project timeline is 18 months from the contract signing date...',
  })
  answer: string;

  @ApiProperty({
    description: 'Source chunks used to generate the answer',
    type: [QuerySource],
  })
  sources: QuerySource[];

  @ApiProperty({
    description: 'Embedding provider used (ollama/openai)',
    example: 'ollama',
  })
  embedding_provider: string;

  @ApiProperty({
    description: 'Processing time in seconds',
    example: 2.45,
  })
  processing_time: number;
}
