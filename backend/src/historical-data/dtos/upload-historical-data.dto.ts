// Stub DTOs for historical data controller
export class UploadHistoricalDataDto {
  filePath?: string;
  fileSize?: number;
  originalFilename?: string;
  mimeType?: string;
}

export class BulkUploadDto {
  documents?: any[];
}

export class UpdateHistoricalDataDto {}
export class QueryHistoricalDataDto {}
