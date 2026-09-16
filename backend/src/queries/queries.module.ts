import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueriesController } from './controller/queries.controller';
import { QueriesService } from './services/queries.service';
import { Query } from './entities/query.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Query]),
  ],
  controllers: [QueriesController],
  providers: [QueriesService],
  exports: [QueriesService], // Export service so other modules can use it
})
export class QueriesModule {}
