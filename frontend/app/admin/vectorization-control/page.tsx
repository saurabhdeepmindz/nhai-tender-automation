'use client';

/**
 * NHAI Tender Query Automation System
 * Admin Vectorization Control Panel
 * 
 * Features:
 * - View vectorization statistics
 * - Manually trigger vectorization for queries
 * - Batch vectorize multiple queries
 * - Retry failed vectorizations
 * - Delete queries from vector DB
 * - Pause/Resume background job
 * - Monitor real-time status
 * 
 * File: frontend/app/admin/vectorization-control/page.tsx
 */

import { useState, useEffect } from 'react';
import {
  Database,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Activity,
  Zap,
  Settings,
  Download,
  Search,
  Filter,
} from 'lucide-react';

// API base URL - NEXT_PUBLIC_API_URL already includes the /api prefix
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface VectorizationStats {
  totalQueries: number;
  vectorizedQueries: number;
  pendingQueries: number;
  vectorizationRate: number;
}

interface Query {
  queryId: string;
  queryText: string;
  rfpNumber: string;
  category: string;
  submittedBy: string;
  submittedAt: string;
  vectorized: boolean;
  vectorStoredAt: string | null;
  status: string;
}

interface FailedVectorization {
  logId: string;
  queryId: string;
  status: string;
  duration: number;
  errorMessage: string;
  attemptedAt: string;
}

interface JobConfig {
  enabled: boolean;
  batchSize: number;
  schedule: string;
  isRunning: boolean;
}

export default function VectorizationControlPage() {
  // State
  const [stats, setStats] = useState<VectorizationStats | null>(null);
  const [queries, setQueries] = useState<Query[]>([]);
  const [failedQueries, setFailedQueries] = useState<FailedVectorization[]>([]);
  const [jobConfig, setJobConfig] = useState<JobConfig | null>(null);
  const [selectedQueries, setSelectedQueries] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'vectorized' | 'pending'>('all');
  const [showConfirmModal, setShowConfirmModal] = useState<{
    show: boolean;
    action: string;
    queryId?: string;
  }>({ show: false, action: '' });

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchQueries(),
        fetchFailedQueries(),
        fetchJobConfig(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // API calls
  const fetchStats = async () => {
    const response = await fetch(`${API_BASE_URL}/admin/vectorization/stats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    const data = await response.json();
    setStats(data.data);
  };

  const fetchQueries = async () => {
    const response = await fetch(
      `${API_BASE_URL}/admin/vectorization/queries?limit=100`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }
    );
    const data = await response.json();
    setQueries(data.data);
  };

  const fetchFailedQueries = async () => {
    const response = await fetch(`${API_BASE_URL}/vectorization/failures`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    const data = await response.json();
    setFailedQueries(data.data);
  };

  const fetchJobConfig = async () => {
    const response = await fetch(`${API_BASE_URL}/admin/vectorization/job/config`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    const data = await response.json();
    setJobConfig(data.data);
  };

  // Actions
  const handleVectorizeQuery = async (queryId: string) => {
    try {
      setActionLoading(`vectorize-${queryId}`);
      const response = await fetch(
        `${API_BASE_URL}/vectorization/query/${queryId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      const data = await response.json();
      
      if (data.success) {
        alert('Query vectorized successfully!');
        fetchAllData();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('Failed to vectorize query');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBatchVectorize = async () => {
    if (selectedQueries.size === 0) {
      alert('Please select at least one query');
      return;
    }

    try {
      setActionLoading('batch');
      const response = await fetch(`${API_BASE_URL}/vectorization/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ queryIds: Array.from(selectedQueries) }),
      });
      const data = await response.json();

      if (data.success) {
        alert(
          `Batch vectorization completed!\nSuccessful: ${data.results.successful}\nFailed: ${data.results.failed}`
        );
        setSelectedQueries(new Set());
        fetchAllData();
      }
    } catch (error) {
      alert('Batch vectorization failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetryFailed = async () => {
    try {
      setActionLoading('retry');
      const response = await fetch(
        `${API_BASE_URL}/vectorization/retry-failures`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      const data = await response.json();

      if (data.success) {
        alert(
          `Retry completed!\nSuccessful: ${data.results.successful}\nFailed: ${data.results.failed}`
        );
        fetchAllData();
      }
    } catch (error) {
      alert('Retry failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteFromVectorDb = async (queryId: string) => {
    try {
      setActionLoading(`delete-${queryId}`);
      const response = await fetch(
        `${API_BASE_URL}/vectorization/query/${queryId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      const data = await response.json();

      if (data.success) {
        alert('Query deleted from vector database');
        fetchAllData();
      }
    } catch (error) {
      alert('Delete failed');
    } finally {
      setActionLoading(null);
      setShowConfirmModal({ show: false, action: '' });
    }
  };

  const handlePauseJob = async () => {
    try {
      setActionLoading('pause');
      const response = await fetch(`${API_BASE_URL}/admin/vectorization/job/pause`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();

      if (data.success) {
        alert('Background job paused');
        fetchJobConfig();
      }
    } catch (error) {
      alert('Failed to pause job');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeJob = async () => {
    try {
      setActionLoading('resume');
      const response = await fetch(`${API_BASE_URL}/admin/vectorization/job/resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();

      if (data.success) {
        alert('Background job resumed');
        fetchJobConfig();
      }
    } catch (error) {
      alert('Failed to resume job');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRunNow = async () => {
    try {
      setActionLoading('run-now');
      const response = await fetch(`${API_BASE_URL}/admin/vectorization/job/run-now`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();

      if (data.success) {
        alert(data.message || 'Vectorization job triggered');
        setTimeout(fetchAllData, 3000);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('Failed to trigger job');
    } finally {
      setActionLoading(null);
    }
  };

  // Filtering
  const filteredQueries = (queries || []).filter((query) => {
    const matchesSearch =
      query.queryText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.rfpNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'vectorized' && query.vectorized) ||
      (filterStatus === 'pending' && !query.vectorized);

    return matchesSearch && matchesFilter;
  });

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedQueries.size === filteredQueries.length) {
      setSelectedQueries(new Set());
    } else {
      setSelectedQueries(new Set(filteredQueries.map((q) => q.queryId)));
    }
  };

  const handleSelectQuery = (queryId: string) => {
    const newSelected = new Set(selectedQueries);
    if (newSelected.has(queryId)) {
      newSelected.delete(queryId);
    } else {
      newSelected.add(queryId);
    }
    setSelectedQueries(newSelected);
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading vectorization data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Vectorization Control Panel
          </h1>
          <p className="text-gray-600">
            Monitor and manage query vectorization processes
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Queries */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <Database className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">
                {stats?.totalQueries || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Total Queries</h3>
          </div>

          {/* Vectorized */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">
                {stats?.vectorizedQueries || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Vectorized</h3>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
              <span className="text-2xl font-bold text-gray-900">
                {stats?.pendingQueries || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Pending</h3>
          </div>

          {/* Success Rate */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">
                {stats?.vectorizationRate?.toFixed(1) || 0}%
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Success Rate</h3>
          </div>
        </div>

        {/* Job Control Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">
                Background Job Control
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  jobConfig?.isRunning
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {jobConfig?.isRunning ? 'Running' : 'Idle'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Schedule</p>
              <p className="font-semibold text-gray-900">
                {jobConfig?.schedule || 'Every 1 minute'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Batch Size</p>
              <p className="font-semibold text-gray-900">
                {jobConfig?.batchSize || 10} queries
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className="font-semibold text-gray-900">
                {jobConfig?.enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePauseJob}
              disabled={!jobConfig?.enabled || actionLoading === 'pause'}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <PauseCircle className="w-5 h-5" />
              Pause Job
            </button>
            <button
              onClick={handleResumeJob}
              disabled={jobConfig?.enabled || actionLoading === 'resume'}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <PlayCircle className="w-5 h-5" />
              Resume Job
            </button>
            <button
              onClick={handleRunNow}
              disabled={actionLoading === 'run-now'}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
              title="Immediately process pending queries instead of waiting for the next scheduled run"
            >
              <Zap className={`w-5 h-5 ${actionLoading === 'run-now' ? 'animate-pulse' : ''}`} />
              Run Now
            </button>
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Failed Queries Section */}
        {(failedQueries || []).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Failed Vectorizations ({(failedQueries || []).length})
                </h2>
              </div>
              <button
                onClick={handleRetryFailed}
                disabled={actionLoading === 'retry'}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors"
              >
                <RefreshCw
                  className={`w-5 h-5 ${actionLoading === 'retry' ? 'animate-spin' : ''}`}
                />
                Retry All Failed
              </button>
            </div>

            <div className="bg-white rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Query ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Error
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Last Attempt
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(failedQueries || []).map((failed) => (
                      <tr key={failed.logId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                          {failed.queryId.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600">
                          {failed.errorMessage}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(failed.attemptedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Queries Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Query Management
              </h2>
              {selectedQueries.size > 0 && (
                <button
                  onClick={handleBatchVectorize}
                  disabled={actionLoading === 'batch'}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                >
                  <Zap
                    className={`w-5 h-5 ${actionLoading === 'batch' ? 'animate-spin' : ''}`}
                  />
                  Vectorize Selected ({selectedQueries.size})
                </button>
              )}
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by query text or RFP number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as 'all' | 'vectorized' | 'pending')
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Queries</option>
                  <option value="vectorized">Vectorized</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedQueries.size === filteredQueries.length &&
                        filteredQueries.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Query
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    RFP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredQueries.map((query) => (
                  <tr key={query.queryId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedQueries.has(query.queryId)}
                        onChange={() => handleSelectQuery(query.queryId)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 line-clamp-2 max-w-md">
                        {query.queryText}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {query.rfpNumber}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        {query.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {query.vectorized ? (
                        <span className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Vectorized
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-yellow-600">
                          <Clock className="w-4 h-4" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(query.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!query.vectorized && (
                          <button
                            onClick={() => handleVectorizeQuery(query.queryId)}
                            disabled={actionLoading === `vectorize-${query.queryId}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Vectorize Now"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                        )}
                        {query.vectorized && (
                          <button
                            onClick={() =>
                              setShowConfirmModal({
                                show: true,
                                action: 'delete',
                                queryId: query.queryId,
                              })
                            }
                            disabled={actionLoading === `delete-${query.queryId}`}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete from Vector DB"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredQueries.length === 0 && (
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No queries found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this query from the vector database?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal({ show: false, action: '' })}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleDeleteFromVectorDb(showConfirmModal.queryId!)
                }
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
