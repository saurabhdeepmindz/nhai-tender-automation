// Custom hooks for Historical Data Management

import { useState, useEffect, useCallback } from 'react';
import { historicalDataApi } from '../services/historical-data.service';
import {
  DashboardStatistics,
  HistoricalData,
  PaginatedResponse,
  FilterOptions,
  MostReferencedItem,
  UploadHistoryResponse,
} from '../types/historical-data.types';

// Hook for dashboard statistics
export function useStatistics() {
  const [data, setData] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await historicalDataApi.getStatistics();
      setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return { data, loading, error, refetch: fetchStatistics };
}

// Hook for historical data
export function useHistoricalData(initialFilters: FilterOptions = {}) {
  const [data, setData] = useState<PaginatedResponse<HistoricalData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await historicalDataApi.getHistoricalData(filters);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return { data, loading, error, filters, updateFilters, refetch: fetchData };
}

// Hook for live data
export function useLiveData(initialFilters: FilterOptions = {}) {
  const [data, setData] = useState<PaginatedResponse<HistoricalData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await historicalDataApi.getLiveData(filters);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch live data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return { data, loading, error, filters, updateFilters, refetch: fetchData };
}

// Hook for most referenced documents
export function useMostReferenced(limit = 25) {
  const [data, setData] = useState<MostReferencedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await historicalDataApi.getMostReferenced(limit);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch most referenced');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Hook for upload history
export function useUploadHistory(initialPage = 1, initialLimit = 20) {
  const [data, setData] = useState<UploadHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await historicalDataApi.getUploadHistory(page, limit);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch upload history');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, page, setPage, limit, setLimit, refetch: fetchData };
}

// Hook for available years
export function useAvailableYears() {
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchYears() {
      try {
        setLoading(true);
        const result = await historicalDataApi.getAvailableYears();
        setYears(result.years);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch years');
      } finally {
        setLoading(false);
      }
    }

    fetchYears();
  }, []);

  return { years, loading, error };
}
