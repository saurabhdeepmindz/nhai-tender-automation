/**
 * NHAI Tender Query Automation System
 * Historical Data Module
 * 
 * Purpose:
 * - Configure Historical Data Management module
 * - Register entity, controller, service, and processor
 * - Setup Bull queue for background processing
 * - Configure file upload and HTTP client
 * 
 * File: backend/src/historical-data/historical-data.module.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HistoricalDataController } from './historical-data.controller';
import { HistoricalDataService } from './historical-data.service';
import { HistoricalDocument } from './entities/historical-document.entity';
import { DocumentProcessingRagProcessor } from './processors/document-processing-rag.processor';
import { Rfp } from '../vendors/entities/rfp.entity';

@Module({
  imports: [
    // Register entity for TypeORM
    TypeOrmModule.forFeature([HistoricalDocument, Rfp]),
    
    // Register Bull queue for background processing
    BullModule.registerQueue({
      name: 'document-processing',
    }),
    
    // HTTP client for Python service calls
    HttpModule,
    
    // Configuration for environment variables
    ConfigModule,
  ],
  controllers: [HistoricalDataController],
  providers: [HistoricalDataService, DocumentProcessingRagProcessor],
  exports: [HistoricalDataService], // Export for use in other modules
})
export class HistoricalDataModule {}
