/**
 * NHAI Tender Query Automation System
 * Vectorization Module
 * 
 * Purpose:
 * - Registers vectorization service and job
 * - Provides dependency injection
 * - Exports services for use in other modules
 * 
 * File: backend/src/vectorization/vectorization.module.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { VectorizationService } from './vectorization.service';
import { VectorizationController } from './vectorization.controller';
import { Query } from '../queries/entities/query.entity';
import { VectorizationLog } from './entities/vectorization-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Query, VectorizationLog]),
    HttpModule.register({
      timeout: 30000, // 30 seconds
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [VectorizationController],
  providers: [VectorizationService],
  exports: [VectorizationService], // Export for use in other modules (like jobs)
})
export class VectorizationModule {}
