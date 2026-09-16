import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';

export enum BulkQueryAction {
  ACCEPT = 'accept',
  REJECT = 'reject',
  ASSIGN = 'assign',
}

export class BulkUpdateQueriesDto {
  @ApiProperty({
    description: 'List of query IDs to update',
    type: [String],
    example: ['d18b38f2-5e4a-4a31-9986-0d8fdc7b6f63', 'd18b38f2-5e4a-4a31-9986-0d8fdc7b6f64'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  queryIds: string[];

  @ApiProperty({
    description: 'Bulk action to apply to all queries',
    enum: BulkQueryAction,
  })
  @IsEnum(BulkQueryAction)
  action: BulkQueryAction;

  @ApiProperty({
    description: 'Assignee for assign action',
    required: false,
    example: 'admin.user@domain.com',
  })
  @IsOptional()
  @IsString()
  assignTo?: string;
}
