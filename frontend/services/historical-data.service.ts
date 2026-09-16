// API service for Historical Data Management

import {
  DashboardStatistics,
  HistoricalData,
  PaginatedResponse,
  FilterOptions,
  MostReferencedItem,
  UploadHistoryResponse,
  UploadFormData,
  BulkUploadResponse,
} from '../types/historical-data.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const API_PREFIX = '/historical-data';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// Helper function to create headers
const createHeaders = (includeAuth = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Helper function to handle response
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred',
    }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export const historicalDataApi = {
  // Get dashboard statistics
  async getStatistics(): Promise<DashboardStatistics> {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/statistics`, {
      headers: createHeaders(),
    });
    return handleResponse<DashboardStatistics>(response);
  },

  // Get historical data with filters
  async getHistoricalData(
    filters: FilterOptions = {}
  ): Promise<PaginatedResponse<HistoricalData>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await fetch(
      `${API_BASE_URL}${API_PREFIX}/historical?${params.toString()}`,
      {
        headers: createHeaders(),
      }
    );
    return handleResponse<PaginatedResponse<HistoricalData>>(response);
  },

  // Get live data
  async getLiveData(
    filters: FilterOptions = {}
  ): Promise<PaginatedResponse<HistoricalData>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await fetch(
      `${API_BASE_URL}${API_PREFIX}/live?${params.toString()}`,
      {
        headers: createHeaders(),
      }
    );
    return handleResponse<PaginatedResponse<HistoricalData>>(response);
  },

  // Get most referenced documents
  async getMostReferenced(limit = 25): Promise<MostReferencedItem[]> {
    const response = await fetch(
      `${API_BASE_URL}${API_PREFIX}/most-referenced?limit=${limit}`,
      {
        headers: createHeaders(),
      }
    );
    return handleResponse<MostReferencedItem[]>(response);
  },

  // Get upload history
  async getUploadHistory(
    page = 1,
    limit = 20
  ): Promise<UploadHistoryResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_PREFIX}/upload-history?page=${page}&limit=${limit}`,
      {
        headers: createHeaders(),
      }
    );
    return handleResponse<UploadHistoryResponse>(response);
  },

  // Upload single file
  async uploadFile(data: UploadFormData): Promise<{ success: boolean; data: HistoricalData }> {
    const formData = new FormData();
    
    if (data.file) {
      formData.append('file', data.file);
    }
    formData.append('rfpNumber', data.rfpNumber);
    formData.append('title', data.title);
    formData.append('type', data.type);
    
    if (data.category) {
      formData.append('category', data.category);
    }
    if (data.metadata) {
      formData.append('metadata', JSON.stringify(data.metadata));
    }

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    return handleResponse(response);
  },

  // Bulk upload files
  async bulkUpload(files: File[], documents: Omit<UploadFormData, 'file'>[]): Promise<BulkUploadResponse> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    formData.append('documents', JSON.stringify(documents));

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/bulk-upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    return handleResponse(response);
  },

  // Get single document by ID
  async getById(id: number): Promise<HistoricalData> {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/${id}`, {
      headers: createHeaders(),
    });
    return handleResponse<HistoricalData>(response);
  },

  // Update document
  async update(
    id: number,
    data: Partial<UploadFormData>
  ): Promise<HistoricalData> {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<HistoricalData>(response);
  },

  // Delete document
  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete document');
    }
  },

  // Get available years for filtering
  async getAvailableYears(): Promise<{ years: number[] }> {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/filters/years`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  // Download CSV template
  async downloadTemplate(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/templates/bulk-csv`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },
};
