/**
 * NHAI Tender Query Automation System
 * Application Bootstrap File
 * 
 * This file initializes the NestJS application, configures middleware,
 * sets up global pipes/filters, and starts the HTTP server.
 * 
 * File: backend/src/main.ts
 * Author: NHAI Development Team
 * Date: January 2026
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import compression from 'compression';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import { WinstonModule, utilities as nestWinstonModuleUtilities, WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  // Winston logger setup
  const logDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  const winstonLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message }) => `${timestamp} - ${level}: ${message}`)
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: path.join(logDir, 'backend.log') })
    ],
  });

  // Create NestJS application with Winston logger
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({
      instance: winstonLogger,
      format: nestWinstonModuleUtilities.format.nestLike('NHAI-Backend', { prettyPrint: true }),
    }),
  });

  // Get configuration service
  const configService = app.get(ConfigService);

  // ========================================================================
  // GLOBAL CONFIGURATION
  // ========================================================================

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable CORS
  const corsEnabled = configService.get<boolean>('CORS_ENABLED', true);
  if (corsEnabled) {
    app.enableCors({
      origin: "*",
      credentials: configService.get<boolean>('CORS_CREDENTIALS', true),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    winstonLogger.info('CORS enabled');
  }

  // ========================================================================
  // MIDDLEWARE
  // ========================================================================

  // Compression middleware
  app.use(compression());
  winstonLogger.info('Compression middleware enabled');

  // Security middleware (Helmet)
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
  }));
  winstonLogger.info('Helmet security middleware enabled');

  // ========================================================================
  // GLOBAL PIPES & FILTERS
  // ========================================================================

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Auto-convert types
      },
    }),
  );
  winstonLogger.info('Global validation pipe configured');

  // ========================================================================
  // STATIC ASSETS
  // ========================================================================

  // Serve uploaded files
  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  winstonLogger.info('Static assets configured');

  // ========================================================================
  // SWAGGER API DOCUMENTATION
  // ========================================================================

  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('NHAI Tender Query Automation API')
      .setDescription(
        'AI-Driven Tender Query Automation and Pre-Bid Reply Generation System API Documentation',
      )
      .setVersion('1.0')
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Users', 'User management')
      .addTag('RFPs', 'Request for Proposals management')
      .addTag('Queries', 'Vendor query management')
      .addTag('Categories', 'Query categories')
      .addTag('Historical & Live Data Management', 'Historical + Live RFPs, Q&A, and Corrigenda')
      .addTag('Pre-bid Query Management', 'Pre-bid query processing and AI responses')
      .addTag('Vectorization', 'Query vectorization management')
      .addTag('Admin - Vectorization', 'Admin vectorization control panel')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
        'JWT',
      )
      .addServer('http://localhost:3001', 'Development Server')
      .addServer('https://api.nhai.gov.in', 'Production Server')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'NHAI API Docs',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    });

    winstonLogger.info('Swagger documentation available at: /api/docs');
  }

  // ========================================================================
  // START SERVER
  // ========================================================================

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  winstonLogger.info('============================================');
  winstonLogger.info('NHAI Tender Query Automation System');
  winstonLogger.info('============================================');
  winstonLogger.info(`Environment: ${nodeEnv}`);
  winstonLogger.info(`Server running on: http://localhost:${port}`);
  winstonLogger.info(`API endpoints: http://localhost:${port}/api`);
  if (nodeEnv !== 'production') {
    winstonLogger.info(`API documentation: http://localhost:${port}/api/docs`);
  }
  winstonLogger.info('============================================');

  // Log configuration
  winstonLogger.info('Configuration:');
  winstonLogger.info(`- Database: ${configService.get('DB_HOST')}:${configService.get('DB_PORT')}`);
  winstonLogger.info(`- Screen 7 (History Retriever): ${configService.get('SCREEN7_URL')}`);
  winstonLogger.info(`- Screen 8 (Chief Engineer): ${configService.get('SCREEN8_URL')}`);
  winstonLogger.info(`- Vectorization Enabled: ${configService.get('VECTORIZATION_ENABLED')}`);
  winstonLogger.info(`- Vectorization Batch Size: ${configService.get('VECTORIZATION_BATCH_SIZE')}`);
  winstonLogger.info('============================================');

  // ========================================================================
  // GRACEFUL SHUTDOWN
  // ========================================================================

  process.on('SIGTERM', async () => {
    winstonLogger.info('SIGTERM signal received: closing HTTP server');
    await app.close();
    winstonLogger.info('HTTP server closed');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    winstonLogger.info('SIGINT signal received: closing HTTP server');
    await app.close();
    winstonLogger.info('HTTP server closed');
    process.exit(0);
  });
}

// Start the application
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
