import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrebidQueryController } from './prebid-query.controller';
import { PrebidQueryService } from './prebid-query.service';
import { Query } from '../queries/entities/query.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Query]),
  ],
  controllers: [PrebidQueryController],
  providers: [PrebidQueryService],
  exports: [PrebidQueryService],
})
export class PrebidQueryModule {}
