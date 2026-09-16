import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoricalDocument } from './entities/historical-document.entity';
import { UploadHistory } from './entities/upload-history.entity';
import { UploadDataDto } from './dto/upload-data.dto';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class HistoricalDataService {
  private readonly logger = new Logger(HistoricalDataService.name);
  private readonly ragServiceUrl = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

  constructor(
    @InjectRepository(HistoricalDocument)
    private readonly documentRepository: Repository<HistoricalDocument>,
    @InjectRepository(UploadHistory)
    private readonly uploadHistoryRepository: Repository<UploadHistory>,
  ) {}

  /**
   * Get statistics for historical data
   */
  async getStatistics() {
    try {
      const [
        totalHistorical,
        totalLive,
        rfpCount,
        qaCount,
        corrigendumCount,
        processedCount,
        pendingCount,
        errorCount,
      ] = await Promise.all([
        this.documentRepository.count({
          where: { isLiveData: false },
        }),
        this.documentRepository.count({
          where: { isLiveData: true },
        }),
        this.documentRepository.count({
          where: { documentType: 'rfp' },
        }),
        this.documentRepository.count({
          where: { documentType: 'qa' },
        }),
        this.documentRepository.count({
          where: { documentType: 'corrigendum' },
        }),
        this.documentRepository.count({
          where: { processingStatus: 'processed' },
        }),
        this.documentRepository.count({
          where: { processingStatus: 'pending' },
        }),
        this.documentRepository.count({
          where: { processingStatus: 'error' },
        }),
      ]);

      // Get AI reference stats
      const refStats = await this.documentRepository
        .createQueryBuilder('doc')
        .select('SUM(doc.aiReferenceCount)', 'totalReferences')
        .addSelect('AVG(doc.aiAccuracy)', 'avgAccuracy')
        .where('doc.aiReferenceCount > 0')
        .getRawOne();

      const total = totalHistorical + totalLive;

      return {
        success: true,
        data: {
          historicalData: {
            total: totalHistorical,
            rfps: rfpCount,
            qa: qaCount,
            corrigenda: corrigendumCount,
          },
          liveData: {
            total: totalLive,
          },
          totalKnowledgeBase: total,
          aiReferencesUsed: {
            total: parseInt(refStats?.totalReferences || '0'),
            avgAccuracy: parseFloat(refStats?.avgAccuracy || '0').toFixed(2),
          },
          processingStatus: {
            processed: processedCount,
            pending: pendingCount,
            error: errorCount,
            successRate: total > 0 ? ((processedCount / total) * 100).toFixed(2) : '0',
          },
        },
      };
    } catch (error) {
      this.logger.error('Error fetching statistics:', error);
      throw new InternalServerErrorException('Failed to fetch statistics');
    }
  }

  /**
   * Get all historical documents with filters
   */
  async getDocuments(filters: {
    type?: string;
    status?: string;
    rfpNumber?: string;
    year?: number;
    page: number;
    pageSize: number;
  }) {
    try {
      const { type, status, rfpNumber, year, page, pageSize } = filters;
      const skip = (page - 1) * pageSize;

      const queryBuilder = this.documentRepository
        .createQueryBuilder('doc')
        .orderBy('doc.uploadedAt', 'DESC');

      if (type) {
        queryBuilder.andWhere('doc.documentType = :type', { type });
      }

      if (status) {
        queryBuilder.andWhere('doc.processingStatus = :status', { status });
      }

      if (rfpNumber) {
        queryBuilder.andWhere('doc.rfpNumber LIKE :rfpNumber', {
          rfpNumber: `%${rfpNumber}%`,
        });
      }

      if (year) {
        queryBuilder.andWhere('EXTRACT(YEAR FROM doc.uploadedAt) = :year', { year });
      }

      const [documents, total] = await queryBuilder
        .skip(skip)
        .take(pageSize)
        .getManyAndCount();

      return {
        success: true,
        data: {
          documents,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      };
    } catch (error) {
      this.logger.error('Error fetching documents:', error);
      throw new InternalServerErrorException('Failed to fetch documents');
    }
  }

  /**
   * Get single document by ID
   */
  async getDocumentById(id: string) {
    try {
      const document = await this.documentRepository.findOne({
        where: { documentId: id },
      });

      if (!document) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      return {
        success: true,
        data: document,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching document:', error);
      throw new InternalServerErrorException('Failed to fetch document');
    }
  }

  /**
   * Upload single historical document
   */
  async uploadDocument(file: Express.Multer.File, uploadDto: UploadDataDto) {
    try {
      this.logger.log(`Uploading document: ${file.originalname}`);

      // Create document record
      const document = this.documentRepository.create({
        documentType: uploadDto.documentType,
        rfpNumber: uploadDto.rfpNumber,
        title: uploadDto.title || file.originalname,
        description: uploadDto.description,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        processingStatus: 'pending',
        isLiveData: false,
        metadata: uploadDto.metadata || {},
      });

      const savedDocument = await this.documentRepository.save(document);

      // Create upload history record
      await this.uploadHistoryRepository.save({
        uploadType: 'single',
        uploadedBy: uploadDto.uploadedBy || 'system',
        fileCount: 1,
        totalSize: file.size,
        successCount: 0,
        failureCount: 0,
        status: 'pending',
        metadata: {
          documents: [savedDocument.documentId],
        },
      });

      // Send to RAG service for processing
      await this.sendToRAGService(savedDocument, file);

      return {
        success: true,
        message: 'Document uploaded successfully',
        data: {
          documentId: savedDocument.documentId,
          documentType: savedDocument.documentType,
          fileName: savedDocument.fileName,
          processingStatus: savedDocument.processingStatus,
        },
      };
    } catch (error) {
      this.logger.error('Error uploading document:', error);
      throw new InternalServerErrorException('Failed to upload document');
    }
  }

  /**
   * Bulk upload historical documents
   */
  async bulkUploadDocuments(
    files: Express.Multer.File[],
    uploadDto: UploadDataDto,
  ) {
    try {
      this.logger.log(`Bulk uploading ${files.length} documents`);

      const uploadHistoryRecord = await this.uploadHistoryRepository.save({
        uploadType: 'bulk',
        uploadedBy: uploadDto.uploadedBy || 'system',
        fileCount: files.length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        successCount: 0,
        failureCount: 0,
        status: 'processing',
        metadata: {},
      });

      const results = [];
      let successCount = 0;
      let failureCount = 0;

      for (const file of files) {
        try {
          const document = this.documentRepository.create({
            documentType: uploadDto.documentType,
            rfpNumber: uploadDto.rfpNumber,
            title: file.originalname,
            fileName: file.originalname,
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            processingStatus: 'pending',
            isLiveData: false,
          });

          const savedDocument = await this.documentRepository.save(document);
          await this.sendToRAGService(savedDocument, file);

          results.push({
            fileName: file.originalname,
            status: 'success',
            documentId: savedDocument.documentId,
          });
          successCount++;
        } catch (error) {
          this.logger.error(`Error uploading file ${file.originalname}:`, error);
          results.push({
            fileName: file.originalname,
            status: 'error',
            error: error.message,
          });
          failureCount++;
        }
      }

      // Update upload history
      await this.uploadHistoryRepository.update(uploadHistoryRecord.historyId, {
        successCount,
        failureCount,
        status: failureCount === 0 ? 'completed' : 'partial',
      });

      return {
        success: true,
        message: `Bulk upload completed: ${successCount} succeeded, ${failureCount} failed`,
        data: {
          totalFiles: files.length,
          successCount,
          failureCount,
          results,
        },
      };
    } catch (error) {
      this.logger.error('Error in bulk upload:', error);
      throw new InternalServerErrorException('Failed to complete bulk upload');
    }
  }

  /**
   * Get upload history
   */
  async getUploadHistory(pagination: { page: number; pageSize: number }) {
    try {
      const { page, pageSize } = pagination;
      const skip = (page - 1) * pageSize;

      const [history, total] = await this.uploadHistoryRepository.findAndCount({
        order: { uploadedAt: 'DESC' },
        skip,
        take: pageSize,
      });

      return {
        success: true,
        data: {
          history,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      };
    } catch (error) {
      this.logger.error('Error fetching upload history:', error);
      throw new InternalServerErrorException('Failed to fetch upload history');
    }
  }

  /**
   * Get most referenced documents
   */
  async getMostReferencedDocuments(limit: number) {
    try {
      const documents = await this.documentRepository.find({
        where: {
          processingStatus: 'processed',
        },
        order: {
          aiReferenceCount: 'DESC',
        },
        take: limit,
      });

      return {
        success: true,
        data: documents,
      };
    } catch (error) {
      this.logger.error('Error fetching most referenced documents:', error);
      throw new InternalServerErrorException('Failed to fetch most referenced documents');
    }
  }

  /**
   * Reprocess a document
   */
  async reprocessDocument(id: string) {
    try {
      const document = await this.documentRepository.findOne({
        where: { documentId: id },
      });

      if (!document) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      // Update status to pending
      document.processingStatus = 'pending';
      await this.documentRepository.save(document);

      // Send to RAG service for reprocessing
      // await this.sendToRAGService(document, null);

      return {
        success: true,
        message: 'Document reprocessing initiated',
        data: {
          documentId: document.documentId,
          status: document.processingStatus,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error reprocessing document:', error);
      throw new InternalServerErrorException('Failed to reprocess document');
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string) {
    try {
      const document = await this.documentRepository.findOne({
        where: { documentId: id },
      });

      if (!document) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      // Delete from RAG service first
      try {
        await axios.delete(
          `${this.ragServiceUrl}/api/rag/documents/${document.documentId}`,
        );
      } catch (error) {
        this.logger.warn('Failed to delete from RAG service:', error.message);
      }

      // Delete from database
      await this.documentRepository.remove(document);

      return {
        success: true,
        message: 'Document deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error deleting document:', error);
      throw new InternalServerErrorException('Failed to delete document');
    }
  }

  /**
   * Search historical documents
   */
  async searchDocuments(query: string, topK: number, documentType: string) {
    try {
      const response = await axios.post(`${this.ragServiceUrl}/api/rag/search`, {
        query,
        top_k: topK,
        document_type: documentType === 'all' ? undefined : documentType,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      this.logger.error('Error searching documents:', error);
      throw new InternalServerErrorException('Failed to search documents');
    }
  }

  /**
   * Get RAG configuration
   */
  async getRAGConfig() {
    try {
      const response = await axios.get(`${this.ragServiceUrl}/api/rag/config`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      this.logger.error('Error fetching RAG config:', error);
      throw new InternalServerErrorException('Failed to fetch RAG configuration');
    }
  }

  /**
   * Update RAG configuration
   */
  async updateRAGConfig(config: Record<string, any>) {
    try {
      const response = await axios.put(
        `${this.ragServiceUrl}/api/rag/config`,
        config,
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      this.logger.error('Error updating RAG config:', error);
      throw new InternalServerErrorException('Failed to update RAG configuration');
    }
  }

  /**
   * Get RAG transactions
   */
  async getRAGTransactions(filters: {
    page: number;
    pageSize: number;
    status?: string;
  }) {
    try {
      const response = await axios.get(`${this.ragServiceUrl}/api/rag/transactions`, {
        params: filters,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      this.logger.error('Error fetching RAG transactions:', error);
      throw new InternalServerErrorException('Failed to fetch RAG transactions');
    }
  }

  /**
   * Send document to RAG service for processing
   */
  private async sendToRAGService(
    document: HistoricalDocument,
    file: Express.Multer.File,
  ) {
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file.buffer, file.originalname);
      }
      formData.append('document_id', document.documentId);
      formData.append('document_type', document.documentType);
      formData.append('rfp_number', document.rfpNumber || '');

      await axios.post(`${this.ragServiceUrl}/api/rag/ingest`, formData, {
        headers: formData.getHeaders(),
      });

      // Update status to processing
      document.processingStatus = 'processing';
      await this.documentRepository.save(document);

      this.logger.log(`Document sent to RAG service: ${document.documentId}`);
    } catch (error) {
      this.logger.error('Error sending to RAG service:', error);
      document.processingStatus = 'error';
      await this.documentRepository.save(document);
      throw error;
    }
  }
}
