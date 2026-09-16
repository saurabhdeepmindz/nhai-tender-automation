import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';

export enum ExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
}

export class ExportQueriesDto {
  @ApiProperty({
    description: 'List of query IDs to export',
    type: [String],
    example: ['d18b38f2-5e4a-4a31-9986-0d8fdc7b6f63'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  queryIds: string[];

  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    default: ExportFormat.CSV,
    required: false,
  })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.CSV;
}
