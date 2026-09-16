/**
 * NHAI Tender Query Automation System
 * Main Application Module
 * 
 * This module bootstraps the entire NestJS application and imports all
 * feature modules, configures dependencies, and sets up the application.
 * 
 * File: backend/src/app.module.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';

// ============================================================================
// CORE MODULES
// ============================================================================
import { AuthModule } from './auth/auth.module';
// import { UsersModule } from './users/users.module';

// ============================================================================
// FEATURE MODULES
// ============================================================================
// import { RfpsModule } from './rfps/rfps.module';
import { QueriesModule } from './queries/queries.module';
// import { CategoriesModule } from './categories/categories.module';
import { HistoricalDataModule } from './historical-data/historical-data.module';
import { PrebidQueryModule } from './prebid-query/prebid-query.module';
import { VendorsModule } from './vendors/vendors.module';
// import { AiResponsesModule } from './ai-responses/ai-responses.module';

// ============================================================================
// VECTORIZATION MODULE (FROM PREVIOUS PROMPT)
// ============================================================================
import { VectorizationModule } from './vectorization/vectorization.module';

// ============================================================================
// ADMIN MODULE (FROM ADMIN PANEL PROMPT)
// ============================================================================
import { AdminModule } from './admin/admin.module';

// ============================================================================
// BACKGROUND JOBS MODULE
// ============================================================================
import { JobsModule } from './jobs/jobs.module';

// ============================================================================
// DATABASE ENTITIES (IMPORT ALL ENTITIES)
// ============================================================================
// import { User } from './users/entities/user.entity';
import { Rfp } from './vendors/entities/rfp.entity';
import { Query } from './queries/entities/query.entity';
// import { Category } from './categories/entities/category.entity';
import { HistoricalData } from './historical-data/entities/historical-data.entity';
import { HistoricalDocument } from './historical-data/entities/historical-document.entity';
// import { AiResponse } from './ai-responses/entities/ai-response.entity';
import { VectorizationLog } from './vectorization/entities/vectorization-log.entity';

@Module({
  imports: [
    // ========================================================================
    // CONFIGURATION MODULE
    // ========================================================================
    ConfigModule.forRoot({
      isGlobal: true, // Make config available throughout the app
      envFilePath: '.env',
      cache: true, // Cache environment variables
    }),

    // ========================================================================
    // SCHEDULE MODULE (FOR CRON JOBS)
    // Required for QueryVectorizationJob
    // ========================================================================
    ScheduleModule.forRoot(),

    // ========================================================================
    // THROTTLER MODULE (RATE LIMITING)
    // Protects API from abuse
    // ========================================================================
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per 60 seconds
      },
    ]),

    // ========================================================================
    // STATIC FILES MODULE (FOR FILE UPLOADS)
    // Serves uploaded documents
    // ========================================================================
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // ========================================================================
    // BULL QUEUE MODULE (FOR BACKGROUND JOBS)
    // Redis-based queue for document processing
    // ========================================================================
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),

    // ========================================================================
    // TYPEORM DATABASE MODULE
    // PostgreSQL connection configuration
    // ========================================================================
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'nhai_tender_db'),
        entities: [
          // User,
          Rfp,
          Query,
          // Category,
          HistoricalData,
          HistoricalDocument,
          // AiResponse,
          VectorizationLog,
        ],
        synchronize: false, // Always use migrations, never auto-sync schema
        logging: configService.get<boolean>('DB_LOGGING', false),
        ssl: false, // Disable SSL for local development
        // Connection pool settings
        extra: {
          max: 20, // Maximum connections in pool
          min: 2,  // Minimum connections in pool
          idleTimeoutMillis: 30000, // Close idle connections after 30s
        },
      }),
      inject: [ConfigService],
    }),

    // ========================================================================
    // CORE MODULES
    // ========================================================================
    AuthModule,        // Authentication & Authorization
    // UsersModule,    // User management

    // ========================================================================
    // FEATURE MODULES
    // ========================================================================
    // RfpsModule,              // RFP management
    QueriesModule,           // Vendor query management
    VendorsModule,           // Vendor dashboard, RFP listing, query listing
    // CategoriesModule,        // Query categories
    HistoricalDataModule,    // Historical data management (Screen 7)
    PrebidQueryModule,       // Pre-bid query management (Screen 8)
    // AiResponsesModule,       // AI response storage

    // ========================================================================
    // VECTORIZATION MODULE
    // Handles automatic query vectorization
    // ========================================================================
    VectorizationModule,

    // ========================================================================
    // ADMIN MODULE
    // Admin-specific endpoints for vectorization control
    // ========================================================================
    AdminModule,

    // ========================================================================
    // JOBS MODULE
    // Background jobs for automatic processing
    // ========================================================================
    JobsModule,
  ],

  // ==========================================================================
  // PROVIDERS
  // Global services
  // ==========================================================================
  providers: [],

  // ==========================================================================
  // CONTROLLERS
  // Root-level controllers (if any)
  // ==========================================================================
  controllers: [AppController],
})
export class AppModule {}
