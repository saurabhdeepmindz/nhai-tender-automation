'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClipboardList, Search, ArrowLeft, RefreshCw } from 'lucide-react';

interface Query {
  id: string;
  queryNumber: string;
  rfpNumber: string;
  queryText: string;
  status: 'pending' | 'answered' | 'clarification_needed';
  submittedAt: string;
  answeredAt?: string;
  response?: string | null;
}

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    pending: 'badge badge-warning',
    answered: 'badge badge-success',
    clarification_needed: 'badge badge-info'
  };
  return styles[status] || 'badge';
};

export default function QueryHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('rfp') || '');
  const validStatuses = ['pending', 'answered', 'clarification_needed'];
  const initialStatus = searchParams.get('status');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'answered' | 'clarification_needed'>(
    initialStatus && validStatuses.includes(initialStatus) ? (initialStatus as any) : 'all'
  );
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendors/queries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setQueries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQueries = queries.filter((query) => {
    const matchesSearch =
      query.queryText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.queryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.rfpNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || query.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-nhai-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Query History</h1>
                <p className="text-sm text-gray-600">All queries you've submitted</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/vendor/dashboard')}
              className="btn btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by query text or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="input sm:w-56"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="answered">Answered</option>
              <option value="clarification_needed">Clarification Needed</option>
            </select>
            <button
              onClick={fetchQueries}
              disabled={loading}
              className="btn btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading queries...</div>
          ) : filteredQueries.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No queries found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQueries.map((query) => (
                <div
                  key={query.id}
                  onClick={() => setSelectedQuery(query)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-medium text-gray-900">{query.queryNumber}</span>
                        <span className="text-sm text-gray-500">RFP: {query.rfpNumber}</span>
                        <span className={getStatusBadge(query.status)}>{query.status}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">{query.queryText}</p>
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(query.submittedAt).toLocaleString()}
                        {query.answeredAt && ` • Answered: ${new Date(query.answeredAt).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Query Detail Modal */}
      {selectedQuery && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedQuery(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedQuery.queryNumber}</h3>
                <p className="text-sm text-gray-500">RFP: {selectedQuery.rfpNumber}</p>
              </div>
              <span className={getStatusBadge(selectedQuery.status)}>{selectedQuery.status}</span>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Query</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedQuery.queryText}</p>
            </div>

            {selectedQuery.response ? (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs font-medium text-blue-700 uppercase mb-1">Response</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedQuery.response}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic mb-4">No response yet.</p>
            )}

            <p className="text-xs text-gray-500 mb-6">
              Submitted: {new Date(selectedQuery.submittedAt).toLocaleString()}
              {selectedQuery.answeredAt && ` • Answered: ${new Date(selectedQuery.answeredAt).toLocaleString()}`}
            </p>

            <button
              onClick={() => setSelectedQuery(null)}
              className="btn btn-secondary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
