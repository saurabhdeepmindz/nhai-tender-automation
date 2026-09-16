// Types for Historical Data Management

export enum HistoricalDataType {
  RFP = 'RFP',
  QA = 'Q&A',
  CORRIGENDUM = 'CORRIGENDUM',
}

export enum UploadStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  ERROR = 'ERROR',
}

export enum DataSource {
  HISTORICAL = 'HISTORICAL',
  LIVE = 'LIVE',
}

export enum UploadType {
  SINGLE = 'SINGLE',
  BULK = 'BULK',
  AUTO = 'AUTO',
}

export interface HistoricalData {
  id: number;
  rfpNumber: string;
  title: string;
  type: HistoricalDataType;
  filePath: string;
  fileSize: number;
  originalFilename: string;
  mimeType: string;
  status: UploadStatus;
  aiReferences: number;
  accuracyPercentage: number;
  uploadDate: string;
  lastUsed: string | null;
  metadata?: Record<string, any>;
  category?: string;
  uploadedBy: number;
}

export interface StatisticsCard {
  title: string;
  count: number;
  breakdown?: Record<string, number>;
  accuracyPercentage?: number;
  monthlyReferences?: number;
}

export interface DashboardStatistics {
  historicalData: StatisticsCard;
  liveData: StatisticsCard;
  totalKnowledgeBase: StatisticsCard;
  aiReferencesUsed: StatisticsCard;
}

export interface MostReferencedItem {
  rfpNumber: string;
  title: string;
  type: HistoricalDataType;
  referenceCount: number;
  accuracyPercentage: number;
  lastUsed: string;
  uploadDate: string;
  packageType: string;
}

export interface UploadHistoryItem {
  id: number;
  title: string;
  description: string;
  uploadTime: string;
  uploadedBy: string;
  fileCount: number;
  totalSize: number;
  successRate: number;
  uploadType: UploadType;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UploadHistoryResponse {
  data: UploadHistoryItem[];
  total: number;
}

export interface FilterOptions {
  search?: string;
  type?: HistoricalDataType | '';
  status?: UploadStatus | '';
  year?: number | '';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface UploadFormData {
  rfpNumber: string;
  title: string;
  type: HistoricalDataType;
  category?: string;
  metadata?: Record<string, any>;
  file?: File;
}

export interface BulkUploadResponse {
  success: boolean;
  message: string;
  totalUploaded: number;
  successCount: number;
  failureCount: number;
  uploadedItems: HistoricalData[];
  errors?: string[];
}
