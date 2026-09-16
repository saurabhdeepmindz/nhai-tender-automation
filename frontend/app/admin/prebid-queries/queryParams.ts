/**
 * Pure helper: builds the URLSearchParams for GET /prebid-queries from the
 * page's filter/search/pagination state. Extracted from page.tsx so it can
 * be unit-tested without mocking fetch/React state.
 */
export interface PrebidQueryFilters {
  status?: string;
  category?: string;
  rfpId?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export function buildQueryParams(filters: PrebidQueryFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.category) params.set('category', filters.category);
  if (filters.rfpId) params.set('rfpId', filters.rfpId);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page));
  params.set('pageSize', String(filters.pageSize));
  return params;
}
