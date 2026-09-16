import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, Between } from 'typeorm';
import {
  HistoricalData,
  HistoricalDataType,
  UploadStatus,
  DataSource,
} from './entities/historical-data.entity';
import { UploadHistory, UploadType } from './entities/upload-history.entity';
import { AIReference } from './entities/ai-reference.entity';
import {
  UploadHistoricalDataDto,
  BulkUploadDto,
  UpdateHistoricalDataDto,
  QueryHistoricalDataDto,
} from './dtos/upload-historical-data.dto';
import {
  HistoricalDataResponseDto,
  DashboardStatisticsResponseDto,
  StatisticsCardDto,
  MostReferencedItemDto,
  UploadHistoryItemDto,
  PaginatedHistoricalDataResponseDto,
  UploadResponseDto,
  BulkUploadResponseDto,
  AIReferenceUpdateDto,
} from './dtos/historical-data-response.dto';

@Injectable()
export class HistoricalDataService {
  private readonly logger = new Logger(HistoricalDataService.name);

  constructor(
    @InjectRepository(HistoricalData)
    private historicalDataRepository: Repository<HistoricalData>,
    @InjectRepository(UploadHistory)
    private uploadHistoryRepository: Repository<UploadHistory>,
    @InjectRepository(AIReference)
    private aiReferenceRepository: Repository<AIReference>,
  ) {}

  /**
   * Get dashboard statistics for the 4 cards
   */
  async getDashboardStatistics(): Promise<DashboardStatisticsResponseDto> {
    // Historical Data (Pre Go-Live)
    const historicalData = await this.getHistoricalDataStats();

    // Live Data (Post Go-Live)
    const liveData = await this.getLiveDataStats();

    // Total Knowledge Base
    const totalKnowledgeBase = await this.getTotalKnowledgeBaseStats();

    // AI References Used
    const aiReferencesUsed = await this.getAIReferencesStats();

    return {
      historicalData,
      liveData,
      totalKnowledgeBase,
      aiReferencesUsed,
    };
  }

  private async getHistoricalDataStats(): Promise<StatisticsCardDto> {
    const total = await this.historicalDataRepository.count({
      where: { dataSource: DataSource.HISTORICAL, isDeleted: false },
    });

    const rfpCount = await this.historicalDataRepository.count({
      where: {
        dataSource: DataSource.HISTORICAL,
        type: HistoricalDataType.RFP,
        isDeleted: false,
      },
    });

    const qaCount = await this.historicalDataRepository.count({
      where: {
        dataSource: DataSource.HISTORICAL,
        type: HistoricalDataType.QA,
        isDeleted: false,
      },
    });

    const corrigendaCount = await this.historicalDataRepository.count({
      where: {
        dataSource: DataSource.HISTORICAL,
        type: HistoricalDataType.CORRIGENDUM,
        isDeleted: false,
      },
    });

    return {
      title: 'Historical Data',
      count: total,
      breakdown: {
        RFPs: rfpCount,
        'Q&A': qaCount,
        Corrigenda: corrigendaCount,
      },
    };
  }

  private async getLiveDataStats(): Promise<StatisticsCardDto> {
    const total = await this.historicalDataRepository.count({
      where: { dataSource: DataSource.LIVE, isDeleted: false },
    });

    const rfpCount = await this.historicalDataRepository.count({
      where: {
        dataSource: DataSource.LIVE,
        type: HistoricalDataType.RFP,
        isDeleted: false,
      },
    });

    const qaCount = await this.historicalDataRepository.count({
      where: {
        dataSource: DataSource.LIVE,
        type: HistoricalDataType.QA,
        isDeleted: false,
      },
    });

    const corrigendaCount = await this.historicalDataRepository.count({
      where: {
        dataSource: DataSource.LIVE,
        type: HistoricalDataType.CORRIGENDUM,
        isDeleted: false,
      },
    });

    // Calculate average accuracy for live data
    const result = await this.historicalDataRepository
      .createQueryBuilder('hd')
      .select('AVG(hd.accuracyPercentage)', 'avgAccuracy')
      .where('hd.dataSource = :source', { source: DataSource.LIVE })
      .andWhere('hd.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('hd.aiReferences > 0')
      .getRawOne();

    return {
      title: 'Live Data',
      count: total,
      breakdown: {
        RFPs: rfpCount,
        'AI Responses': qaCount,
        'AI Corrigenda': corrigendaCount,
      },
      accuracyPercentage: result?.avgAccuracy ? parseFloat(result.avgAccuracy) : 0,
    };
  }

  private async getTotalKnowledgeBaseStats(): Promise<StatisticsCardDto> {
    const total = await this.historicalDataRepository.count({
      where: { isDeleted: false },
    });

    return {
      title: 'Total Knowledge Base',
      count: total,
    };
  }

  private async getAIReferencesStats(): Promise<StatisticsCardDto> {
    // Total AI references
    const totalRefs = await this.aiReferenceRepository.count();

    // Monthly references (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRefs = await this.aiReferenceRepository.count({
      where: {
        referenceTime: Between(startOfMonth, now),
      },
    });

    // Average accuracy
    const result = await this.aiReferenceRepository
      .createQueryBuilder('ar')
      .select('AVG(ar.accuracyScore)', 'avgAccuracy')
      .where('ar.accuracyScore IS NOT NULL')
      .getRawOne();

    return {
      title: 'AI References Used',
      count: totalRefs,
      monthlyReferences: monthlyRefs,
      accuracyPercentage: result?.avgAccuracy ? parseFloat(result.avgAccuracy) : 0,
    };
  }

  /**
   * Upload single historical data document
   */
  async uploadHistoricalData(
    dto: UploadHistoricalDataDto,
    userId: number,
  ): Promise<UploadResponseDto> {
    try {
      // Extract year from RFP number or metadata
      const year = this.extractYear(dto.rfpNumber, dto.metadata);

      const historicalData = this.historicalDataRepository.create({
        ...dto,
        year,
        uploaded_by: userId,
        dataSource: DataSource.HISTORICAL,
      });

      const saved = await this.historicalDataRepository.save(historicalData);

      // Create upload history entry
      await this.createUploadHistory({
        title: `Single Upload: ${dto.title}`,
        description: `Uploaded ${dto.type} document`,
        uploadType: UploadType.SINGLE,
        fileCount: 1,
        totalSize: dto.fileSize || 0,
        successRate: 100,
        successCount: 1,
        failureCount: 0,
        uploadedBy: userId,
        uploadedDocumentIds: [saved.id],
      });

      this.logger.log(`Historical data uploaded successfully: ${saved.id}`);

      return {
        success: true,
        message: 'File uploaded successfully',
        data: this.mapToResponseDto(saved),
      };
    } catch (error) {
      this.logger.error(`Error uploading historical data: ${error.message}`);
      throw new BadRequestException('Failed to upload historical data');
    }
  }

  /**
   * Bulk upload historical data
   */
  async bulkUploadHistoricalData(
    dto: BulkUploadDto,
    userId: number,
  ): Promise<BulkUploadResponseDto> {
    const uploadedItems: HistoricalDataResponseDto[] = [];
    const errors: string[] = [];
    let successCount = 0;
    let failureCount = 0;
    let totalSize = 0;

    for (const document of dto.documents) {
      try {
        const year = this.extractYear(document.rfpNumber, document.metadata);

        const historicalData = this.historicalDataRepository.create({
          ...document,
          year,
          uploaded_by: userId,
          dataSource: DataSource.HISTORICAL,
        });

        const saved = await this.historicalDataRepository.save(historicalData);
        uploadedItems.push(this.mapToResponseDto(saved));
        successCount++;
        totalSize += document.fileSize || 0;
      } catch (error) {
        failureCount++;
        errors.push(`Failed to upload ${document.rfpNumber}: ${error.message}`);
        this.logger.error(`Bulk upload error for ${document.rfpNumber}: ${error.message}`);
      }
    }

    const successRate = (successCount / dto.documents.length) * 100;

    // Create upload history entry
    await this.createUploadHistory({
      title: `Bulk Upload: ${dto.batchId || 'Historical Data'}`,
      description: `Bulk upload of ${dto.documents.length} documents`,
      uploadType: UploadType.BULK,
      fileCount: dto.documents.length,
      totalSize,
      successRate,
      successCount,
      failureCount,
      uploadedBy: userId,
      batchId: dto.batchId,
      uploadedDocumentIds: uploadedItems.map((item) => item.id),
      errors: errors.length > 0 ? errors : null,
    });

    this.logger.log(
      `Bulk upload completed: ${successCount} success, ${failureCount} failures`,
    );

    return {
      success: failureCount === 0,
      message:
        failureCount === 0
          ? 'Bulk upload completed successfully'
          : `Bulk upload completed with ${failureCount} failures`,
      totalUploaded: dto.documents.length,
      successCount,
      failureCount,
      uploadedItems,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get historical data with filtering and pagination
   */
  async getHistoricalData(
    query: QueryHistoricalDataDto,
  ): Promise<PaginatedHistoricalDataResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.historicalDataRepository
      .createQueryBuilder('hd')
      .where('hd.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('hd.dataSource = :source', { source: DataSource.HISTORICAL });

    // Apply filters
    if (query.search) {
      queryBuilder.andWhere(
        '(hd.rfpNumber ILIKE :search OR hd.title ILIKE :search OR hd.category ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.type) {
      queryBuilder.andWhere('hd.type = :type', { type: query.type });
    }

    if (query.status) {
      queryBuilder.andWhere('hd.status = :status', { status: query.status });
    }

    if (query.year) {
      queryBuilder.andWhere('hd.year = :year', { year: query.year });
    }

    // Apply sorting
    const sortBy = query.sortBy || 'uploadDate';
    const sortOrder = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`hd.${sortBy}`, sortOrder);

    // Execute query with pagination
    const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      data: data.map((item) => this.mapToResponseDto(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get live data (post go-live)
   */
  async getLiveData(query: QueryHistoricalDataDto): Promise<PaginatedHistoricalDataResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.historicalDataRepository
      .createQueryBuilder('hd')
      .where('hd.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('hd.dataSource = :source', { source: DataSource.LIVE });

    // Apply filters (similar to historical data)
    if (query.search) {
      queryBuilder.andWhere(
        '(hd.rfpNumber ILIKE :search OR hd.title ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.type) {
      queryBuilder.andWhere('hd.type = :type', { type: query.type });
    }

    // Apply sorting
    const sortBy = query.sortBy || 'uploadDate';
    const sortOrder = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`hd.${sortBy}`, sortOrder);

    const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      data: data.map((item) => this.mapToResponseDto(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get most referenced documents (top 25)
   */
  async getMostReferenced(limit: number = 25): Promise<MostReferencedItemDto[]> {
    const data = await this.historicalDataRepository
      .createQueryBuilder('hd')
      .where('hd.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('hd.aiReferences > 0')
      .orderBy('hd.aiReferences', 'DESC')
      .addOrderBy('hd.accuracyPercentage', 'DESC')
      .limit(limit)
      .getMany();

    return data.map((item) => ({
      rfpNumber: item.rfpNumber,
      title: item.title,
      type: item.type,
      referenceCount: item.aiReferences,
      accuracyPercentage: parseFloat(item.accuracyPercentage.toString()),
      lastUsed: item.lastUsed,
      uploadDate: item.uploadDate,
      packageType: this.getPackageType(item),
    }));
  }

  /**
   * Get upload history
   */
  async getUploadHistory(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: UploadHistoryItemDto[]; total: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.uploadHistoryRepository.findAndCount({
      skip,
      take: limit,
      order: { uploadTime: 'DESC' },
      relations: ['uploadedBy'],
    });

    return {
      data: data.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        uploadTime: item.uploadTime,
        uploadedBy: item.uploadedBy?.name || 'System',
        fileCount: item.fileCount,
        totalSize: Number(item.totalSize),
        successRate: parseFloat(item.successRate.toString()),
        uploadType: item.uploadType,
      })),
      total,
    };
  }

  /**
   * Get single historical data by ID
   */
  async getHistoricalDataById(id: number): Promise<HistoricalDataResponseDto> {
    const data = await this.historicalDataRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!data) {
      throw new NotFoundException(`Historical data with ID ${id} not found`);
    }

    return this.mapToResponseDto(data);
  }

  /**
   * Update historical data
   */
  async updateHistoricalData(
    id: number,
    dto: UpdateHistoricalDataDto,
  ): Promise<HistoricalDataResponseDto> {
    const data = await this.historicalDataRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!data) {
      throw new NotFoundException(`Historical data with ID ${id} not found`);
    }

    Object.assign(data, dto);
    const updated = await this.historicalDataRepository.save(data);

    this.logger.log(`Historical data updated: ${id}`);

    return this.mapToResponseDto(updated);
  }

  /**
   * Delete historical data (soft delete)
   */
  async deleteHistoricalData(id: number): Promise<void> {
    const data = await this.historicalDataRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!data) {
      throw new NotFoundException(`Historical data with ID ${id} not found`);
    }

    data.isDeleted = true;
    await this.historicalDataRepository.save(data);

    this.logger.log(`Historical data deleted: ${id}`);
  }

  /**
   * Track AI reference usage
   */
  async trackAIReference(dto: AIReferenceUpdateDto): Promise<void> {
    // Create AI reference record
    const aiReference = this.aiReferenceRepository.create({
      historicalDataId: dto.historicalDataId,
      rfpNumber: dto.rfpNumber,
      queryContext: dto.queryContext,
      accuracyScore: dto.accuracyScore,
      referenceTime: dto.referenceTime || new Date(),
    });

    await this.aiReferenceRepository.save(aiReference);

    // Update historical data reference count and last used
    await this.historicalDataRepository.increment(
      { id: dto.historicalDataId },
      'aiReferences',
      1,
    );

    await this.historicalDataRepository.update(
      { id: dto.historicalDataId },
      { lastUsed: new Date() },
    );

    // Update accuracy percentage (moving average)
    const data = await this.historicalDataRepository.findOne({
      where: { id: dto.historicalDataId },
    });

    if (data) {
      const newAccuracy =
        (parseFloat(data.accuracyPercentage.toString()) * (data.aiReferences - 1) +
          dto.accuracyScore) /
        data.aiReferences;

      await this.historicalDataRepository.update(
        { id: dto.historicalDataId },
        { accuracyPercentage: newAccuracy },
      );
    }

    this.logger.log(`AI reference tracked for document: ${dto.historicalDataId}`);
  }

  /**
   * Helper: Create upload history entry
   */
  private async createUploadHistory(data: Partial<UploadHistory>): Promise<UploadHistory> {
    const history = this.uploadHistoryRepository.create(data);
    return await this.uploadHistoryRepository.save(history);
  }

  /**
   * Helper: Extract year from RFP number or metadata
   */
  private extractYear(rfpNumber: string, metadata?: Record<string, any>): number {
    // Try to extract from metadata first
    if (metadata?.year) {
      return parseInt(metadata.year.toString());
    }

    // Try to extract from RFP number (e.g., RFP-2023-NH-145)
    const yearMatch = rfpNumber.match(/(\d{4})/);
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }

    // Default to current year
    return new Date().getFullYear();
  }

  /**
   * Helper: Determine package type for most referenced
   */
  private getPackageType(data: HistoricalData): string {
    // This would need more sophisticated logic based on related documents
    if (data.type === HistoricalDataType.RFP) {
      return '📁 Complete Package';
    } else if (data.type === HistoricalDataType.QA) {
      return '📁 RFP + Pre-Bid Q&A';
    } else {
      return '📁 RFP + Multiple Corrigenda';
    }
  }

  /**
   * Helper: Map entity to response DTO
   */
  private mapToResponseDto(data: HistoricalData): HistoricalDataResponseDto {
    return {
      id: data.id,
      rfpNumber: data.rfpNumber,
      title: data.title,
      type: data.type,
      filePath: data.filePath,
      fileSize: Number(data.fileSize),
      originalFilename: data.originalFilename,
      mimeType: data.mimeType,
      status: data.status,
      aiReferences: data.aiReferences,
      accuracyPercentage: parseFloat(data.accuracyPercentage.toString()),
      uploadDate: data.uploadDate,
      lastUsed: data.lastUsed,
      metadata: data.metadata,
      category: data.category,
      uploadedBy: data.uploaded_by,
    };
  }
}
