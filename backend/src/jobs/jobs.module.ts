/**
 * NHAI Tender Query Automation System
 * Jobs Module
 * 
 * Purpose:
 * - Registers background jobs
 * - Provides dependency injection for scheduled tasks
 * 
 * File: backend/src/jobs/jobs.module.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Query } from '../queries/entities/query.entity';
import { VectorizationLog } from '../vectorization/entities/vectorization-log.entity';
import { VectorizationModule } from '../vectorization/vectorization.module';
import { QueryVectorizationJob } from './query-vectorization.job';

@Module({
  imports: [
    TypeOrmModule.forFeature([Query, VectorizationLog]),
    VectorizationModule, // Import VectorizationModule to use VectorizationService
  ],
  providers: [QueryVectorizationJob],
  exports: [QueryVectorizationJob],
})
export class JobsModule {}
