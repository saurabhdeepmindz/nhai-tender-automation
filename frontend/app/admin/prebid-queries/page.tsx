'use client';

/**
 * NHAI Tender Query Automation System
 * Admin Pre-bid Query Management (Screen 7)
 *
 * Table-based admin workspace for reviewing and finalizing pre-bid query
 * responses: filter/search, view the AI response alongside past RFP
 * reference/response, edit and save the admin response, update status
 * (per-row or in bulk).
 *
 * File: frontend/app/admin/prebid-queries/page.tsx
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { buildQueryParams } from './queryParams';
import { StatCard } from './StatCard';
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Save,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  answered: 'Answered',
  clarification_needed: 'Clarification Needed',
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  under_review: 'bg-blue-100 text-blue-700',
  answered: 'bg-green-100 text-green-700',
  clarification_needed: 'bg-orange-100 text-orange-700',
};

interface PrebidQuery {
  queryId: string;
  srNo: number;
  clauseReference: string | null;
  pageNumber: number | null;
  clauseTitle: string | null;
  queryText: string;
  aiResponse: string | null;
  pastRefResponse: string | null;
  pastResponse: string | null;
  adminResponse: string | null;
  status: string;
  rfpNumber: string | null;
  categoryName: string | null;
  confidence: number | null;
}

interface Stats {
  totalQueries: number;
  pending: number;
  underReview: number;
  answered: number;
  clarificationNeeded: number;
  aiProcessed: number;
  avgResponseTime: number;
  avgConfidence: string;
}

interface FilterOptions {
  statuses: string[];
  categories: { id: number; name: string }[];
  rfps: { id: string; number: string }[];
}

export default function PrebidQueryManagementPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [queries, setQueries] = useState<PrebidQuery[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [rfpFilter, setRfpFilter] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('answered');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Local edit buffer for admin-response textareas, keyed by queryId
  const [draftResponses, setDraftResponses] = useState<Record<string, string>>({});

  // Mirrored horizontal scrollbar shown above the (wide) table, so it can be
  // reached without scrolling all the way down past every row first.
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const syncingScroll = useRef<'top' | 'table' | null>(null);

  const handleTopScroll = () => {
    if (syncingScroll.current === 'table') { syncingScroll.current = null; return; }
    if (!topScrollRef.current || !tableScrollRef.current) return;
    syncingScroll.current = 'top';
    tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
  };

  const handleTableScroll = () => {
    if (syncingScroll.current === 'top') { syncingScroll.current = null; return; }
    if (!topScrollRef.current || !tableScrollRef.current) return;
    syncingScroll.current = 'table';
    topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
  };

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  const fetchStats = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/prebid-queries/statistics`, {
      headers: authHeaders(),
    });
    const json = await res.json();
    if (json.success) setStats(json.data);
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/prebid-queries/filters`, {
      headers: authHeaders(),
    });
    const json = await res.json();
    if (json.success) setFilterOptions(json.data);
  }, []);

  const fetchQueries = useCallback(async () => {
    const params = buildQueryParams({
      status: statusFilter,
      category: categoryFilter,
      rfpId: rfpFilter,
      search: searchTerm,
      page,
      pageSize,
    });

    const res = await fetch(`${API_BASE_URL}/prebid-queries?${params.toString()}`, {
      headers: authHeaders(),
    });
    const json = await res.json();
    if (json.success) {
      setQueries(json.data.queries);
      setTotalPages(json.data.pagination.totalPages || 1);
      setTotal(json.data.pagination.total || 0);
    }
  }, [statusFilter, categoryFilter, rfpFilter, searchTerm, page, pageSize]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStats(), fetchFilterOptions(), fetchQueries()]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchStats, fetchFilterOptions, fetchQueries]);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, rfpFilter, page]);

  // Recompute the mirrored top scrollbar's width whenever the table's
  // content (and therefore its actual scroll width) changes.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setTableScrollWidth(tableScrollRef.current?.scrollWidth ?? 0);
    });
    return () => cancelAnimationFrame(raf);
  }, [queries]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQueries();
  };

  const handleSelectAll = () => {
    if (selectedIds.size === queries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(queries.map((q) => q.queryId)));
    }
  };

  const handleSelectRow = (queryId: string) => {
    const next = new Set(selectedIds);
    if (next.has(queryId)) next.delete(queryId);
    else next.add(queryId);
    setSelectedIds(next);
  };

  const handleStatusChange = async (queryId: string, status: string) => {
    setQueries((prev) =>
      prev.map((q) => (q.queryId === queryId ? { ...q, status } : q)),
    );
    try {
      const res = await fetch(`${API_BASE_URL}/prebid-queries/${queryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      fetchStats();
    } catch (err) {
      alert('Failed to update status');
      fetchQueries();
    }
  };

  const handleSaveAdminResponse = async (queryId: string) => {
    const response = draftResponses[queryId];
    if (response === undefined) return;
    setSavingId(queryId);
    try {
      const res = await fetch(`${API_BASE_URL}/prebid-queries/${queryId}/admin-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ response }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setQueries((prev) =>
        prev.map((q) =>
          q.queryId === queryId
            ? { ...q, adminResponse: response, status: json.data.status }
            : q,
        ),
      );
      setDraftResponses((prev) => {
        const next = { ...prev };
        delete next[queryId];
        return next;
      });
      fetchStats();
      alert('Admin response saved');
    } catch (err) {
      alert('Failed to save admin response');
    } finally {
      setSavingId(null);
    }
  };

  const handleBulkApply = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/prebid-queries/bulk/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ queryIds: Array.from(selectedIds), status: bulkStatus }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      alert(json.message);
      setSelectedIds(new Set());
      fetchAll();
    } catch (err) {
      alert('Bulk update failed');
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading pre-bid queries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pre-bid Query Management
          </h1>
          <p className="text-gray-600">
            Review AI responses, compare against past RFP history, and finalize admin responses
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon={<FileText className="w-6 h-6 text-blue-600" />} value={stats?.totalQueries ?? 0} label="Total" border="border-blue-500" />
          <StatCard icon={<Clock className="w-6 h-6 text-yellow-600" />} value={stats?.pending ?? 0} label="Pending" border="border-yellow-500" />
          <StatCard icon={<RefreshCw className="w-6 h-6 text-blue-600" />} value={stats?.underReview ?? 0} label="Under Review" border="border-blue-400" />
          <StatCard icon={<CheckCircle className="w-6 h-6 text-green-600" />} value={stats?.answered ?? 0} label="Answered" border="border-green-500" />
          <StatCard icon={<AlertCircle className="w-6 h-6 text-orange-600" />} value={stats?.clarificationNeeded ?? 0} label="Clarification Needed" border="border-orange-500" />
          <StatCard icon={<CheckCircle className="w-6 h-6 text-purple-600" />} value={`${stats?.avgConfidence ?? 0}%`} label="Avg Confidence" border="border-purple-500" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by query ID, vendor, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={rfpFilter}
              onChange={(e) => { setRfpFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All RFPs</option>
              {filterOptions?.rfps.map((r) => (
                <option key={r.id} value={r.id}>{r.number}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              {filterOptions?.statuses.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {filterOptions?.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Filter className="w-4 h-4" />
              Apply
            </button>
          </form>
        </div>

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.size} selected
            </span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              {(filterOptions?.statuses || []).map((s) => (
                <option key={s} value={s}>Set to: {STATUS_LABELS[s] || s}</option>
              ))}
            </select>
            <button
              onClick={handleBulkApply}
              disabled={bulkLoading}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300"
            >
              {bulkLoading ? 'Applying...' : 'Apply to Selected'}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-1.5 text-gray-600 text-sm hover:bg-gray-100 rounded-lg"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Mirrored top scrollbar - lets you scroll the wide table right
              without first scrolling all the way down to the bottom one. */}
          {tableScrollWidth > 0 && (
            <div
              ref={topScrollRef}
              onScroll={handleTopScroll}
              className="overflow-x-auto overflow-y-hidden border-b border-gray-200"
              style={{ height: 16 }}
            >
              <div style={{ width: tableScrollWidth, height: 1 }} />
            </div>
          )}
          <div ref={tableScrollRef} onScroll={handleTableScroll} className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === queries.length && queries.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase text-xs">Sr.No</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase text-xs">Clause Ref</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase text-xs">Page</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase text-xs min-w-[160px]">Query</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase text-xs min-w-[200px]">AI Response</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase text-xs min-w-[160px]">Past RFP Reference</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase text-xs min-w-[160px]">Past Response</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase text-xs min-w-[220px]">Admin Response</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {queries.map((q) => {
                  const draft = draftResponses[q.queryId] ?? q.adminResponse ?? '';
                  const isDirty = draftResponses[q.queryId] !== undefined &&
                    draftResponses[q.queryId] !== (q.adminResponse ?? '');
                  return (
                    <tr key={q.queryId} className="hover:bg-gray-50 align-top">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(q.queryId)}
                          onChange={() => handleSelectRow(q.queryId)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-3 text-gray-900">{q.srNo}</td>
                      <td className="px-3 py-3 text-gray-600">{q.clauseReference || '—'}</td>
                      <td className="px-3 py-3 text-gray-600">{q.pageNumber ?? '—'}</td>
                      <td className="px-3 py-3 text-gray-900">
                        <p className="line-clamp-3" title={q.queryText}>{q.queryText}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {q.rfpNumber || '—'} · {q.categoryName || '—'}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        <p className="line-clamp-3" title={q.aiResponse || ''}>{q.aiResponse || '—'}</p>
                        {q.confidence != null && (
                          <span className="text-xs text-purple-600">Confidence: {q.confidence}%</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        <p className="line-clamp-3" title={q.pastRefResponse || ''}>{q.pastRefResponse || '—'}</p>
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        <p className="line-clamp-3" title={q.pastResponse || ''}>{q.pastResponse || '—'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <textarea
                          value={draft}
                          onChange={(e) =>
                            setDraftResponses((prev) => ({ ...prev, [q.queryId]: e.target.value }))
                          }
                          rows={3}
                          className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter final admin response..."
                        />
                        {isDirty && (
                          <button
                            onClick={() => handleSaveAdminResponse(q.queryId)}
                            disabled={savingId === q.queryId}
                            className="mt-1 flex items-center gap-1 text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
                          >
                            <Save className="w-3 h-3" />
                            {savingId === q.queryId ? 'Saving...' : 'Save'}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={q.status}
                          onChange={(e) => handleStatusChange(q.queryId, e.target.value)}
                          className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${STATUS_BADGE_CLASS[q.status] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {(filterOptions?.statuses || Object.keys(STATUS_LABELS)).map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {queries.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No pre-bid queries found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              {total} total query{total === 1 ? '' : 'ies'} · Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
