/**
 * Queries Module - Index
 * 
 * Central export point for all queries module components.
 * Use this for clean imports in other modules.
 * 
 * Example usage:
 * import { QueriesModule, QueriesService, CreateQueryDto } from './queries';
 */

// Module
export { QueriesModule } from './queries.module';

// Service
export { QueriesService, QueryFilters, PaginationOptions } from './services/queries.service';

// Controller
export { QueriesController } from './controllers/queries.controller';

// DTOs
export { 
  CreateQueryDto, 
  QueryCategory, 
  AttachmentDto 
} from './dtos/create-query.dto';

export { 
  UpdateQueryDto, 
  QueryStatus 
} from './dtos/update-query.dto';

export {
  QueryResponseDto,
  QueryListResponseDto,
  QueryStatisticsDto,
} from './dtos/query-response.dto';

// Entity
export { Query } from './entities/query.entity';
