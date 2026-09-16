/**
 * API Client for communicating with backend API
 * Uses environment variable for base URL
 */

const API_BASE_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface BulkUpdateRequest {
  queryIds: string[];
  action: 'accept' | 'reject' | 'assign';
  assignTo?: string;
}

export interface ExportRequest {
  queryIds: string[];
  format?: 'csv' | 'xlsx';
}

export const apiClient = {
  /**
   * Bulk update queries
   */
  async bulkUpdateQueries(data: BulkUpdateRequest) {
    const response = await fetch('/api/queries/bulk-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Bulk update failed: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Export queries as CSV
   */
  async exportQueries(data: ExportRequest) {
    const response = await fetch('/api/queries/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get all queries
   */
  async getQueries(page = 1, pageSize = 20) {
    const response = await fetch(
      `/api/queries?page=${page}&pageSize=${pageSize}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch queries: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get query by ID
   */
  async getQuery(queryId: string) {
    const response = await fetch(`/api/queries/${queryId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch query: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get query statistics
   */
  async getQueryStats(rfpId?: string) {
    const params = new URLSearchParams();
    if (rfpId) params.append('rfpId', rfpId);

    const response = await fetch(`/api/queries/statistics?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.statusText}`);
    }

    return response.json();
  },
};
