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
import { join } from 'path';

async function bootstrap() {
  // Create logger instance
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
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
      origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3001'),
      credentials: configService.get<boolean>('CORS_CREDENTIALS', true),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    logger.log('CORS enabled');
  }

  // ========================================================================
  // MIDDLEWARE
  // ========================================================================

  // Compression middleware
  app.use(compression());
  logger.log('Compression middleware enabled');

  // Security middleware (Helmet)
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
  }));
  logger.log('Helmet security middleware enabled');

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
  logger.log('Global validation pipe configured');

  // ========================================================================
  // STATIC ASSETS
  // ========================================================================

  // Serve uploaded files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  logger.log('Static assets configured');

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
      .addTag('Historical Data', 'Historical RFPs, Q&A, and Corrigenda')
      .addTag('Pre-bid Queries', 'Pre-bid query processing and AI responses')
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
      .addServer('http://localhost:3000', 'Development Server')
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

    logger.log('Swagger documentation available at: /api/docs');
  }

  // ========================================================================
  // START SERVER
  // ========================================================================

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log('============================================');
  logger.log('NHAI Tender Query Automation System');
  logger.log('============================================');
  logger.log(`Environment: ${nodeEnv}`);
  logger.log(`Server running on: http://localhost:${port}`);
  logger.log(`API endpoints: http://localhost:${port}/api`);
  if (nodeEnv !== 'production') {
    logger.log(`API documentation: http://localhost:${port}/api/docs`);
  }
  logger.log('============================================');

  // Log configuration
  logger.log('Configuration:');
  logger.log(`- Database: ${configService.get('DB_HOST')}:${configService.get('DB_PORT')}`);
  logger.log(`- Screen 7 (History Retriever): ${configService.get('SCREEN7_URL')}`);
  logger.log(`- Screen 8 (Chief Engineer): ${configService.get('SCREEN8_URL')}`);
  logger.log(`- Vectorization Enabled: ${configService.get('VECTORIZATION_ENABLED')}`);
  logger.log(`- Vectorization Batch Size: ${configService.get('VECTORIZATION_BATCH_SIZE')}`);
  logger.log('============================================');

  // ========================================================================
  // GRACEFUL SHUTDOWN
  // ========================================================================

  process.on('SIGTERM', async () => {
    logger.log('SIGTERM signal received: closing HTTP server');
    await app.close();
    logger.log('HTTP server closed');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT signal received: closing HTTP server');
    await app.close();
    logger.log('HTTP server closed');
    process.exit(0);
  });
}

// Start the application
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
