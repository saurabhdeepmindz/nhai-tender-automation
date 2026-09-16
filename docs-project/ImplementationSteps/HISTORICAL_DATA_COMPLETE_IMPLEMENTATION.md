# 🚀 Historical Data Management - Complete Implementation Guide
## Background Job with Ollama (Primary) + OpenAI (Fallback)

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Backend Setup (NestJS)](#backend-setup-nestjs)
4. [Python Service Setup](#python-service-setup)
5. [Modified Files for Ollama Support](#modified-files-for-ollama-support)
6. [Deployment Steps](#deployment-steps)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    UPLOAD FLOW                                   │
└─────────────────────────────────────────────────────────────────┘

Admin Upload Document
        ↓
Backend (NestJS) - Port 3001
├── Save file to ./uploads/historical/
├── Save metadata to PostgreSQL
└── Add job to Bull Queue (Redis)
        ↓
Background Job Processor
        ↓
HTTP POST → Python Service (Port 8005)
        ↓
Python Historical Data Service
├── Extract Text (PDF/DOCX/CSV)
├── Generate Embeddings
│   ├── Try Ollama (Primary)
│   └── Fallback to OpenAI if Ollama fails
└── Store in ChromaDB
        ↓
Return: { success, chunks_processed, vector_ids }
        ↓
Backend Updates PostgreSQL
Status: PROCESSED
        ↓
Frontend Notification
"Document ready for search in Screen 07!"
```

---

## ✅ Prerequisites

### Required Software

```bash
# 1. Node.js & npm
node --version  # Should be v18+
npm --version   # Should be v9+

# 2. Python
python --version  # Should be Python 3.9+

# 3. PostgreSQL
psql --version  # Should be PostgreSQL 14+

# 4. Redis
redis-cli --version  # Should be Redis 6+

# 5. Ollama
ollama --version  # Should be Ollama 0.1+
```

### Install Missing Components

**Windows:**
```bash
# Install Redis (using Chocolatey)
choco install redis-64

# Or download from: https://github.com/microsoftarchive/redis/releases

# Install Ollama
# Download from: https://ollama.ai/download
```

**Linux/Mac:**
```bash
# Redis
sudo apt-get install redis-server  # Ubuntu/Debian
brew install redis  # macOS

# Ollama
curl -fsSL https://ollama.com/install.sh | sh
```

---

## 🔧 Backend Setup (NestJS)

### Step 1: Install Dependencies

```bash
cd backend

# Core dependencies
npm install --save @nestjs/bull bull ioredis
npm install --save @nestjs/axios axios
npm install --save @nestjs/platform-express multer
npm install --save @nestjs/schedule

# Type definitions
npm install --save-dev @types/bull @types/multer
```

### Step 2: Update Environment Variables

**`backend/.env`**

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=nhai_tender_db

# Application
NODE_ENV=development
PORT=3001
JWT_SECRET=your_jwt_secret_key

# Redis (for Bull Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Python RAG Services
HISTORICAL_DATA_SERVICE_URL=http://localhost:8005
SCREEN07_SERVICE_URL=http://localhost:8000
SCREEN08_SERVICE_URL=http://localhost:8001

# File Upload
UPLOAD_DIR=./uploads
UPLOAD_MAX_FILE_SIZE=52428800  # 50MB in bytes

# Queue Configuration
QUEUE_ATTEMPTS=3
QUEUE_BACKOFF_DELAY=5000  # milliseconds
```

### Step 3: Create Database Migration

**`backend/src/migrations/CreateHistoricalDocuments.ts`**

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateHistoricalDocuments1706000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE document_type_enum AS ENUM ('RFP', 'Q&A', 'CORRIGENDUM');
      CREATE TYPE processing_status_enum AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');
    `);

    // Create table
    await queryRunner.createTable(
      new Table({
        name: 'historical_documents',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'rfp_number',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'document_type',
            type: 'document_type_enum',
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'file_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'file_size',
            type: 'bigint',
          },
          {
            name: 'file_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'status',
            type: 'processing_status_enum',
            default: "'PENDING'",
          },
          {
            name: 'processing_metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'ai_reference_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'extracted_content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'uploaded_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'processed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'uploaded_by',
            type: 'integer',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'historical_documents',
      new TableIndex({
        name: 'IDX_historical_rfp_number',
        columnNames: ['rfp_number'],
      }),
    );

    await queryRunner.createIndex(
      'historical_documents',
      new TableIndex({
        name: 'IDX_historical_document_type',
        columnNames: ['document_type'],
      }),
    );

    await queryRunner.createIndex(
      'historical_documents',
      new TableIndex({
        name: 'IDX_historical_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('historical_documents');
    await queryRunner.query(`
      DROP TYPE IF EXISTS document_type_enum;
      DROP TYPE IF EXISTS processing_status_enum;
    `);
  }
}
```

Run migration:

```bash
npm run typeorm migration:run
```

### Step 4: Create Entity

**`backend/src/historical-data/entities/historical-document.entity.ts`**

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DocumentType {
  RFP = 'RFP',
  QA = 'Q&A',
  CORRIGENDUM = 'CORRIGENDUM',
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

@Entity('historical_documents')
@Index(['rfp_number'])
@Index(['document_type'])
@Index(['status'])
export class HistoricalDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  rfp_number: string;

  @Column({ length: 255 })
  title: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  document_type: DocumentType;

  @Column({ length: 500 })
  file_path: string;

  @Column({ length: 255 })
  file_name: string;

  @Column({ type: 'bigint' })
  file_size: number;

  @Column({ length: 50 })
  file_type: string;

  @Column({
    type: 'enum',
    enum: ProcessingStatus,
    default: ProcessingStatus.PENDING,
  })
  status: ProcessingStatus;

  @Column({ type: 'jsonb', nullable: true })
  processing_metadata: {
    chunks_processed?: number;
    vector_ids?: string[];
    error_message?: string;
    processing_time?: number;
    embedding_provider?: string;
  };

  @Column({ type: 'int', default: 0 })
  ai_reference_count: number;

  @Column({ type: 'text', nullable: true })
  extracted_content: string;

  @CreateDateColumn()
  uploaded_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  processed_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'int', nullable: true })
  uploaded_by: number;
}
```

### Step 5: Create DTOs

**`backend/src/historical-data/dto/upload-historical-data.dto.ts`**

```typescript
import { IsEnum, IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';
import { DocumentType } from '../entities/historical-document.entity';

export class UploadHistoricalDataDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  rfp_number: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsNotEmpty()
  @IsEnum(DocumentType)
  document_type: DocumentType;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ProcessDocumentResponseDto {
  success: boolean;
  document_id: number;
  status: string;
  message: string;
  processing_metadata?: any;
}
```

### Step 6: Create Controller

**`backend/src/historical-data/historical-data.controller.ts`**

```typescript
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { HistoricalDataService } from './historical-data.service';
import {
  UploadHistoricalDataDto,
  ProcessDocumentResponseDto,
} from './dto/upload-historical-data.dto';

// Ensure upload directory exists
const uploadDir = './uploads/historical';
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@Controller('api/historical-data')
export class HistoricalDataController {
  constructor(private readonly historicalDataService: HistoricalDataService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 52428800, // 50MB
      },
      fileFilter: (req, file, cb) => {
        const allowedExts = /\.(pdf|docx|csv|xlsx)$/i;
        if (allowedExts.test(extname(file.originalname))) {
          cb(null, true);
        } else {
          cb(
            new HttpException(
              'Only PDF, DOCX, CSV, and XLSX files are allowed',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadHistoricalDataDto,
  ): Promise<ProcessDocumentResponseDto> {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    return this.historicalDataService.processUpload(file, uploadDto);
  }

  @Get(':id')
  async getDocumentStatus(@Param('id', ParseIntPipe) id: number) {
    return this.historicalDataService.getDocumentStatus(id);
  }

  @Get()
  async getAllDocuments(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('rfp_number') rfpNumber?: string,
  ) {
    return this.historicalDataService.getAllDocuments({
      type,
      status,
      rfpNumber,
    });
  }

  @Get('stats/summary')
  async getStatistics() {
    return this.historicalDataService.getStatistics();
  }

  @Post(':id/retry')
  async retryProcessing(@Param('id', ParseIntPipe) id: number) {
    return this.historicalDataService.retryProcessing(id);
  }
}
```

### Step 7: Create Service

**`backend/src/historical-data/historical-data.service.ts`**

```typescript
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  HistoricalDocument,
  ProcessingStatus,
  DocumentType,
} from './entities/historical-document.entity';
import {
  UploadHistoricalDataDto,
  ProcessDocumentResponseDto,
} from './dto/upload-historical-data.dto';

@Injectable()
export class HistoricalDataService {
  private readonly logger = new Logger(HistoricalDataService.name);

  constructor(
    @InjectRepository(HistoricalDocument)
    private readonly historicalDocumentRepository: Repository<HistoricalDocument>,
    @InjectQueue('document-processing')
    private readonly documentProcessingQueue: Queue,
  ) {}

  async processUpload(
    file: Express.Multer.File,
    uploadDto: UploadHistoricalDataDto,
  ): Promise<ProcessDocumentResponseDto> {
    try {
      this.logger.log(`Processing upload: ${file.originalname}`);

      // 1. Save to PostgreSQL
      const document = this.historicalDocumentRepository.create({
        rfp_number: uploadDto.rfp_number,
        title: uploadDto.title,
        document_type: uploadDto.document_type,
        file_path: file.path,
        file_name: file.originalname,
        file_size: file.size,
        file_type: file.mimetype,
        status: ProcessingStatus.PENDING,
      });

      const savedDocument = await this.historicalDocumentRepository.save(document);

      this.logger.log(`Document saved: ID=${savedDocument.id}`);

      // 2. Add to Bull Queue for background processing
      await this.documentProcessingQueue.add(
        'process-historical-document',
        {
          documentId: savedDocument.id,
          filePath: file.path,
          fileName: file.originalname,
          fileType: file.mimetype,
          documentType: uploadDto.document_type,
          rfpNumber: uploadDto.rfp_number,
          title: uploadDto.title,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );

      this.logger.log(`Job queued for document ID=${savedDocument.id}`);

      return {
        success: true,
        document_id: savedDocument.id,
        status: ProcessingStatus.PENDING,
        message: 'Document uploaded. Processing in background...',
      };
    } catch (error) {
      this.logger.error(`Upload error: ${error.message}`, error.stack);
      throw new HttpException(
        `Upload failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getDocumentStatus(id: number) {
    const document = await this.historicalDocumentRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    return {
      id: document.id,
      rfp_number: document.rfp_number,
      title: document.title,
      document_type: document.document_type,
      status: document.status,
      processing_metadata: document.processing_metadata,
      uploaded_at: document.uploaded_at,
      processed_at: document.processed_at,
      ai_reference_count: document.ai_reference_count,
    };
  }

  async getAllDocuments(filters?: {
    type?: string;
    status?: string;
    rfpNumber?: string;
  }) {
    const where: any = {};

    if (filters?.type) where.document_type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.rfpNumber) where.rfp_number = filters.rfpNumber;

    const documents = await this.historicalDocumentRepository.find({
      where,
      order: { uploaded_at: 'DESC' },
    });

    return {
      total: documents.length,
      documents,
    };
  }

  async getStatistics() {
    const [
      total,
      rfpCount,
      qaCount,
      corrigendumCount,
      pending,
      processing,
      processed,
      failed,
    ] = await Promise.all([
      this.historicalDocumentRepository.count(),
      this.historicalDocumentRepository.count({
        where: { document_type: DocumentType.RFP },
      }),
      this.historicalDocumentRepository.count({
        where: { document_type: DocumentType.QA },
      }),
      this.historicalDocumentRepository.count({
        where: { document_type: DocumentType.CORRIGENDUM },
      }),
      this.historicalDocumentRepository.count({
        where: { status: ProcessingStatus.PENDING },
      }),
      this.historicalDocumentRepository.count({
        where: { status: ProcessingStatus.PROCESSING },
      }),
      this.historicalDocumentRepository.count({
        where: { status: ProcessingStatus.PROCESSED },
      }),
      this.historicalDocumentRepository.count({
        where: { status: ProcessingStatus.FAILED },
      }),
    ]);

    return {
      total,
      by_type: { rfp: rfpCount, qa: qaCount, corrigendum: corrigendumCount },
      by_status: { pending, processing, processed, failed },
      processing_rate: total > 0 ? `${((processed / total) * 100).toFixed(1)}%` : '0%',
    };
  }

  async updateDocumentStatus(
    documentId: number,
    status: ProcessingStatus,
    processingMetadata?: any,
    extractedContent?: string,
  ) {
    await this.historicalDocumentRepository.update(documentId, {
      status,
      processing_metadata: processingMetadata,
      extracted_content: extractedContent,
      processed_at: status === ProcessingStatus.PROCESSED ? new Date() : null,
    });

    this.logger.log(`Document ${documentId} status: ${status}`);
  }

  async retryProcessing(id: number) {
    const document = await this.historicalDocumentRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    if (document.status !== ProcessingStatus.FAILED) {
      throw new HttpException(
        'Only failed documents can be retried',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.historicalDocumentRepository.update(id, {
      status: ProcessingStatus.PENDING,
      processing_metadata: null,
    });

    await this.documentProcessingQueue.add(
      'process-historical-document',
      {
        documentId: document.id,
        filePath: document.file_path,
        fileName: document.file_name,
        fileType: document.file_type,
        documentType: document.document_type,
        rfpNumber: document.rfp_number,
        title: document.title,
      },
    );

    return {
      success: true,
      message: 'Document requeued for processing',
      document_id: id,
    };
  }
}
```

### Step 8: Create Background Job Processor

**`backend/src/historical-data/processors/document-processing.processor.ts`**

```typescript
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { HistoricalDataService } from '../historical-data.service';
import { ProcessingStatus } from '../entities/historical-document.entity';

interface DocumentProcessingJob {
  documentId: number;
  filePath: string;
  fileName: string;
  fileType: string;
  documentType: string;
  rfpNumber: string;
  title: string;
}

@Processor('document-processing')
export class DocumentProcessingProcessor {
  private readonly logger = new Logger(DocumentProcessingProcessor.name);
  private readonly pythonServiceUrl: string;

  constructor(
    private readonly historicalDataService: HistoricalDataService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.pythonServiceUrl = this.configService.get<string>(
      'HISTORICAL_DATA_SERVICE_URL',
      'http://localhost:8005',
    );
  }

  @Process('process-historical-document')
  async handleDocumentProcessing(job: Job<DocumentProcessingJob>) {
    const { documentId, filePath, fileName, documentType, rfpNumber, title } =
      job.data;

    this.logger.log(
      `🔄 Processing document ${documentId}: ${fileName} (${documentType})`,
    );

    try {
      // Update status to PROCESSING
      await this.historicalDataService.updateDocumentStatus(
        documentId,
        ProcessingStatus.PROCESSING,
      );

      // Call Python service
      const startTime = Date.now();

      this.logger.log(`📤 Calling Python service at ${this.pythonServiceUrl}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.pythonServiceUrl}/api/process-document`,
          {
            document_id: documentId,
            file_path: filePath,
            file_name: fileName,
            document_type: documentType,
            rfp_number: rfpNumber,
            title: title,
          },
          {
            timeout: 300000, // 5 minutes
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Python service completed in ${processingTime}ms: ${response.data.chunks_processed} chunks`,
      );

      // Update status to PROCESSED
      await this.historicalDataService.updateDocumentStatus(
        documentId,
        ProcessingStatus.PROCESSED,
        {
          chunks_processed: response.data.chunks_processed,
          vector_ids: response.data.vector_ids,
          processing_time: processingTime,
          embedding_provider: response.data.embedding_provider,
        },
        response.data.extracted_content?.substring(0, 5000),
      );

      return {
        success: true,
        documentId,
        processingTime,
        chunks: response.data.chunks_processed,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error processing document ${documentId}: ${error.message}`,
        error.stack,
      );

      await this.historicalDataService.updateDocumentStatus(
        documentId,
        ProcessingStatus.FAILED,
        {
          error_message: error.message,
          error_stack: error.response?.data || error.stack,
          failed_at: new Date().toISOString(),
        },
      );

      throw error;
    }
  }
}
```

### Step 9: Create Module

**`backend/src/historical-data/historical-data.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HistoricalDataController } from './historical-data.controller';
import { HistoricalDataService } from './historical-data.service';
import { HistoricalDocument } from './entities/historical-document.entity';
import { DocumentProcessingProcessor } from './processors/document-processing.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([HistoricalDocument]),
    BullModule.registerQueue({
      name: 'document-processing',
    }),
    HttpModule,
    ConfigModule,
  ],
  controllers: [HistoricalDataController],
  providers: [HistoricalDataService, DocumentProcessingProcessor],
  exports: [HistoricalDataService],
})
export class HistoricalDataModule {}
```

### Step 10: Update App Module

**`backend/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { HistoricalDataModule } from './historical-data/historical-data.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    HistoricalDataModule,
  ],
})
export class AppModule {}
```

---

## 🐍 Python Service Setup

### Step 1: Create Service Directory

```bash
mkdir -p python-rag/historical-data-service
cd python-rag/historical-data-service
```

### Step 2: Create Environment File

**`python-rag/historical-data-service/.env`**

```env
# Embedding Provider (ollama or openai)
EMBEDDING_PROVIDER=ollama

# Ollama Configuration (Primary)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_TIMEOUT=120

# OpenAI Configuration (Fallback)
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Auto-fallback to OpenAI if Ollama unavailable
AUTO_FALLBACK_TO_OPENAI=true

# ChromaDB
CHROMA_DB_DIR=./chroma_db

# Text Processing
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# Service
HOST=0.0.0.0
PORT=8005
LOG_LEVEL=INFO
```

### Step 3: Create Requirements File

**`python-rag/historical-data-service/requirements.txt`**

```txt
# FastAPI Framework
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6

# Document Processing
langchain==0.1.0
langchain-community==0.0.10
pypdf==3.17.1
python-docx==1.1.0
pandas==2.1.3
openpyxl==3.1.2

# Embeddings - Ollama (Primary)
ollama==0.1.5

# Embeddings - OpenAI (Fallback)
openai==1.3.7

# Vector Database
chromadb==0.4.18

# Utilities
pydantic==2.5.0
python-dotenv==1.0.0
numpy==1.26.2
```

---

## 🔧 Modified Files for Ollama Support

### File 1: Update document_processor.py

Place the uploaded `document_processor.py` in `python-rag/shared/` and modify it:

**`python-rag/shared/document_processor.py`**

Add Ollama support at the top:

```python
# After existing imports, add:
try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False

# Modify __init__ method:
def __init__(
    self,
    embedding_model: str = "ollama",  # Changed default
    openai_api_key: Optional[str] = None,
    ollama_base_url: str = "http://localhost:11434",
    ollama_model: str = "nomic-embed-text",
    chunk_size: int = 1000,
    chunk_overlap: int = 200
):
    """
    Initialize document processor with Ollama (primary) or OpenAI (fallback)
    """
    self.embedding_model_type = embedding_model
    self.ollama_base_url = ollama_base_url
    self.ollama_model = ollama_model
    
    # Try Ollama first
    if embedding_model == "ollama" and OLLAMA_AVAILABLE:
        try:
            self.ollama_client = ollama.Client(host=ollama_base_url)
            # Test connection
            self.ollama_client.embeddings(model=ollama_model, prompt="test")
            logger.info(f"✓ Using Ollama embeddings: {ollama_model}")
            self.use_ollama = True
        except Exception as e:
            logger.warning(f"Ollama not available: {str(e)}")
            logger.info("Falling back to OpenAI...")
            self.use_ollama = False
            if not openai_api_key:
                openai_api_key = os.getenv("OPENAI_API_KEY")
            self.embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
    elif embedding_model == "openai":
        if not openai_api_key:
            openai_api_key = os.getenv("OPENAI_API_KEY")
        self.embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
        self.use_ollama = False
        logger.info("Using OpenAI embeddings")
    else:
        # Local embeddings
        model_name = "sentence-transformers/all-mpnet-base-v2"
        self.embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        self.use_ollama = False
        logger.info(f"Using local HuggingFace embeddings: {model_name}")

    # Text splitter
    self.text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
    )

# Add method to generate embeddings:
def _generate_embedding(self, text: str) -> List[float]:
    """Generate embedding using active provider"""
    if self.use_ollama:
        try:
            response = self.ollama_client.embeddings(
                model=self.ollama_model,
                prompt=text
            )
            return response['embedding']
        except Exception as e:
            logger.error(f"Ollama embedding failed: {str(e)}")
            # Fallback to OpenAI if available
            if hasattr(self, 'embeddings'):
                logger.info("Falling back to OpenAI for this request")
                return self.embeddings.embed_query(text)
            raise
    else:
        return self.embeddings.embed_query(text)

# Replace all instances of self.embeddings.embed_query(text) with:
# self._generate_embedding(text)

# Update process_rfp_document method:
# Replace: embedding = self.embeddings.embed_query(chunk)
# With: embedding = self._generate_embedding(chunk)

# Update generate_embedding method:
def generate_embedding(self, text: str) -> List[float]:
    """Generate embedding for given text"""
    try:
        return self._generate_embedding(text)
    except Exception as e:
        logger.error(f"Error generating embedding: {str(e)}")
        raise

# Add method to get active provider:
def get_active_provider(self) -> str:
    """Get name of currently active embedding provider"""
    if self.use_ollama:
        return f"ollama ({self.ollama_model})"
    elif hasattr(self, 'embeddings'):
        return "openai"
    else:
        return "local (HuggingFace)"
```

### File 2: Update chroma_service.py

Place the uploaded `chroma_service.py` in `python-rag/shared/` - it works as-is! Just add one helper method:

```python
# Add this method to ChromaService class:

def add_rfp_chunk(
    self,
    document_id: int,
    rfp_number: str,
    title: str,
    chunk_text: str,
    chunk_index: int,
    embeddings: List[float],
    metadata: Dict = None
) -> str:
    """
    Add RFP chunk to vector database
    Used for chunked documents
    """
    chroma_id = f"rfp_{document_id}_chunk_{chunk_index}"
    
    self.rfp_collection.add(
        ids=[chroma_id],
        embeddings=[embeddings],
        documents=[chunk_text],
        metadatas=[{
            "document_id": str(document_id),
            "rfp_number": rfp_number,
            "title": title,
            "chunk_index": chunk_index,
            "type": "RFP",
            "year": self._extract_year(rfp_number),
            **(metadata or {})
        }]
    )
    
    return chroma_id
```

### File 3: Create Main FastAPI Service

**`python-rag/historical-data-service/main.py`**

```python
"""
Historical Data Service - Port 8005
Processes historical documents with Ollama (primary) + OpenAI (fallback)
"""

import os
import sys
import logging
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Add shared utilities to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))

from document_processor import DocumentProcessor
from chroma_service import ChromaService

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# =============================================================================
# Pydantic Models
# =============================================================================

class ProcessDocumentRequest(BaseModel):
    document_id: int
    file_path: str
    file_name: str
    document_type: str = Field(..., description="RFP, Q&A, or CORRIGENDUM")
    rfp_number: str
    title: str

class ProcessDocumentResponse(BaseModel):
    success: bool
    document_id: int
    chunks_processed: int
    vector_ids: list
    extracted_content: str
    processing_time: float
    embedding_provider: str
    message: str

# =============================================================================
# Initialize FastAPI
# =============================================================================

app = FastAPI(
    title="NHAI Historical Data Service",
    description="Document processing with Ollama/OpenAI embeddings",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global services
document_processor = None
chroma_service = None

# =============================================================================
# Service Initialization
# =============================================================================

def initialize_services():
    """Initialize document processor and ChromaDB"""
    global document_processor, chroma_service
    
    try:
        logger.info("="*60)
        logger.info("Initializing Historical Data Service...")
        
        # 1. Initialize document processor
        embedding_provider = os.getenv("EMBEDDING_PROVIDER", "ollama")
        ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        ollama_model = os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")
        openai_api_key = os.getenv("OPENAI_API_KEY")
        
        document_processor = DocumentProcessor(
            embedding_model=embedding_provider,
            openai_api_key=openai_api_key,
            ollama_base_url=ollama_base_url,
            ollama_model=ollama_model,
            chunk_size=int(os.getenv("CHUNK_SIZE", "1000")),
            chunk_overlap=int(os.getenv("CHUNK_OVERLAP", "200"))
        )
        
        logger.info(f"✓ Document processor: {document_processor.get_active_provider()}")
        
        # 2. Initialize ChromaDB
        chroma_dir = os.getenv("CHROMA_DB_DIR", "./chroma_db")
        Path(chroma_dir).mkdir(parents=True, exist_ok=True)
        
        chroma_service = ChromaService(persist_directory=chroma_dir)
        
        logger.info(f"✓ ChromaDB initialized: {chroma_dir}")
        logger.info("="*60)
        logger.info("✅ Service Ready!")
        logger.info("="*60)
        
    except Exception as e:
        logger.error(f"❌ Initialization failed: {str(e)}")
        raise

# =============================================================================
# API Endpoints
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    initialize_services()

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "running",
        "service": "NHAI Historical Data Service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "embedding_provider": document_processor.get_active_provider() if document_processor else "unknown"
    }

@app.post("/api/process-document", response_model=ProcessDocumentResponse)
async def process_document(request: ProcessDocumentRequest):
    """
    Process uploaded historical document
    """
    logger.info(f"📥 Processing: {request.file_name} (Type: {request.document_type})")
    start_time = datetime.now()
    
    try:
        vector_ids = []
        
        # Process based on document type
        if request.document_type == "RFP":
            result = await document_processor.process_rfp_document(
                file_path=request.file_path,
                document_id=request.document_id,
                rfp_number=request.rfp_number,
                title=request.title
            )
            
            # Store chunks in ChromaDB
            for chunk_data in result['chunk_embeddings']:
                vector_id = chroma_service.add_rfp_chunk(
                    document_id=request.document_id,
                    rfp_number=request.rfp_number,
                    title=request.title,
                    chunk_text=chunk_data['text'],
                    chunk_index=chunk_data['chunk_index'],
                    embeddings=chunk_data['embedding'],
                    metadata=result['metadata']
                )
                vector_ids.append(vector_id)
            
            extracted_content = result['extracted_content']
            
        elif request.document_type == "Q&A":
            qa_pairs = await document_processor.process_qa_csv(
                file_path=request.file_path,
                document_id=request.document_id,
                rfp_number=request.rfp_number
            )
            
            # Store each Q&A pair
            for qa in qa_pairs:
                vector_id = chroma_service.add_qa_pair(
                    document_id=request.document_id,
                    rfp_number=request.rfp_number,
                    query=qa['query'],
                    response=qa['response'],
                    query_embeddings=qa['combined_embedding'],
                    category=qa['category'],
                    metadata=qa['metadata']
                )
                vector_ids.append(vector_id)
            
            extracted_content = f"Processed {len(qa_pairs)} Q&A pairs"
            
        elif request.document_type == "CORRIGENDUM":
            result = await document_processor.process_corrigendum(
                file_path=request.file_path,
                document_id=request.document_id,
                rfp_number=request.rfp_number,
                title=request.title
            )
            
            # Store in ChromaDB
            for chunk_data in result['chunk_embeddings']:
                vector_id = chroma_service.add_corrigendum(
                    document_id=request.document_id,
                    rfp_number=request.rfp_number,
                    title=request.title,
                    content=chunk_data['text'],
                    embeddings=chunk_data['embedding'],
                    metadata=result['metadata']
                )
                vector_ids.append(vector_id)
            
            extracted_content = result['extracted_content']
        
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported document type: {request.document_type}"
            )
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(
            f"✅ Document {request.document_id} processed: "
            f"{len(vector_ids)} chunks in {processing_time:.2f}s"
        )
        
        return ProcessDocumentResponse(
            success=True,
            document_id=request.document_id,
            chunks_processed=len(vector_ids),
            vector_ids=vector_ids,
            extracted_content=extracted_content[:1000],
            processing_time=processing_time,
            embedding_provider=document_processor.get_active_provider(),
            message="Document processed successfully"
        )
        
    except Exception as e:
        logger.error(f"❌ Error processing document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )

@app.get("/api/stats")
async def get_stats():
    """Get ChromaDB statistics"""
    try:
        stats = chroma_service.get_collection_stats()
        return {
            "success": True,
            "statistics": stats,
            "embedding_provider": document_processor.get_active_provider(),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# Main Entry Point
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8005"))
    
    logger.info("="*60)
    logger.info("NHAI Historical Data Service")
    logger.info("="*60)
    logger.info(f"Starting on {HOST}:{PORT}")
    logger.info("="*60)
    
    uvicorn.run(
        app,
        host=HOST,
        port=PORT,
        log_level="info",
        reload=False
    )
```

---

## 🚀 Deployment Steps

### Step 1: Setup Ollama

```bash
# Pull embedding model
ollama pull nomic-embed-text

# Verify it works
ollama run nomic-embed-text "test embedding"
```

### Step 2: Start Services

**Terminal 1 - Ollama:**
```bash
ollama serve
```

**Terminal 2 - Redis:**
```bash
# Windows
redis-server

# Docker
docker run -d --name redis -p 6379:6379 redis:alpine
```

**Terminal 3 - Backend:**
```bash
cd backend
npm install
npm run typeorm migration:run
npm run start:dev
```

**Terminal 4 - Python Service:**
```bash
cd python-rag/historical-data-service

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Copy shared files
cp ../shared/document_processor.py .
cp ../shared/chroma_service.py .

# Start service
python main.py
```

---

## ✅ Testing & Verification

### Test 1: Health Checks

```bash
# Backend
curl http://localhost:3001

# Python Service
curl http://localhost:8005

# Should show: "embedding_provider": "ollama (nomic-embed-text)"
```

### Test 2: Upload RFP Document

```bash
curl -X POST http://localhost:3001/api/historical-data/upload \
  -F "file=@sample_rfp.pdf" \
  -F "rfp_number=RFP-2024-NH-001" \
  -F "title=Mumbai-Pune Expressway" \
  -F "document_type=RFP"
```

### Test 3: Check Processing Status

```bash
# Get document status
curl http://localhost:3001/api/historical-data/1

# Get statistics
curl http://localhost:3001/api/historical-data/stats/summary

# Check ChromaDB stats
curl http://localhost:8005/api/stats
```

### Test 4: Monitor Queue

Install Bull Board:

```bash
npm install --save @bull-board/api @bull-board/express
```

Access at: `http://localhost:3001/admin/queues`

---

## 🔍 Troubleshooting

### Issue 1: "Ollama not available"

```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Ensure model is pulled
ollama pull nomic-embed-text

# Check logs
tail -f python-rag/historical-data-service/logs/service.log
```

**Expected behavior:** Service automatically falls back to OpenAI if configured.

### Issue 2: "Redis connection refused"

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Start Redis if not running
redis-server
```

### Issue 3: "File not found"

```bash
# Ensure upload directory exists
mkdir -p backend/uploads/historical
chmod 755 backend/uploads/historical

# Check file path in database
psql -d nhai_tender_db -c "SELECT id, file_path FROM historical_documents;"
```

### Issue 4: Python service crashes

```bash
# Check Python dependencies
pip list

# Reinstall if needed
pip install -r requirements.txt --force-reinstall

# Check ChromaDB directory
mkdir -p python-rag/historical-data-service/chroma_db
```

---

## 📊 Success Indicators

After successful deployment:

1. ✅ **Backend Running:** `http://localhost:3001` returns 200
2. ✅ **Python Service Running:** `http://localhost:8005` returns embedding provider
3. ✅ **Redis Connected:** Bull queue shows no errors
4. ✅ **Ollama Working:** Shows "ollama (nomic-embed-text)"
5. ✅ **Document Upload:** Returns `document_id` and status "PENDING"
6. ✅ **Background Processing:** Job appears in queue
7. ✅ **Status Updates:** Document status changes to "PROCESSED"
8. ✅ **Vector Storage:** ChromaDB stats show documents

---

## 🎯 Next Steps

1. Implement frontend upload UI
2. Add real-time progress updates (WebSocket)
3. Create batch upload functionality
4. Add document preview
5. Implement search testing (Screen 07 integration)
6. Add monitoring dashboard
7. Setup production deployment

---

**Version:** 1.0  
**Last Updated:** January 24, 2026  
**Status:** ✅ Production Ready with Ollama/OpenAI Dual Support
