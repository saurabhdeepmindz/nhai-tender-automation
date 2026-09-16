'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Eye,
  Download
} from 'lucide-react';

interface Transaction {
  transactionId: string;
  type: 'search' | 'embed' | 'index' | 'query';
  status: 'success' | 'failed' | 'pending';
  duration: number;
  timestamp: string;
  documents: number;
  accuracy?: number;
  errorMessage?: string;
  metadata: {
    model?: string;
    vectorStore?: string;
    queryText?: string;
    resultsCount?: number;
  };
}

export default function RAGTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalTransactions: 0,
    successRate: 0,
    avgDuration: 0,
    failedToday: 0,
  });

  useEffect(() => {
    fetchTransactions();
    fetchStatistics();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchTransactions();
      fetchStatistics();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/rag-transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/rag-transactions/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchTransactions();
    fetchStatistics();
  };

  const exportTransactions = () => {
    const csv = [
      ['Transaction ID', 'Type', 'Status', 'Duration (ms)', 'Timestamp', 'Documents', 'Accuracy'],
      ...filteredTransactions.map(t => [
        t.transactionId,
        t.type,
        t.status,
        t.duration,
        t.timestamp,
        t.documents,
        t.accuracy || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rag-transactions-${new Date().toISOString()}.csv`;
    a.click();
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.metadata.queryText?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesType = filterType === 'all' || t.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4 animate-spin" />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'search': return 'bg-blue-100 text-blue-800';
      case 'embed': return 'bg-purple-100 text-purple-800';
      case 'index': return 'bg-green-100 text-green-800';
      case 'query': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RAG Transactions</h1>
                <p className="text-sm text-gray-600">Real-time monitoring of RAG service operations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportTransactions}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTransactions}</p>
              </div>
              <Activity className="w-10 h-10 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">All time</p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-green-600">{stats.successRate}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Last 24 hours</p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Duration</p>
                <p className="text-3xl font-bold text-purple-600">{stats.avgDuration}ms</p>
              </div>
              <Clock className="w-10 h-10 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Response time</p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Failed Today</p>
                <p className="text-3xl font-bold text-red-600">{stats.failedToday}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Requires attention</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="search">Search</option>
                <option value="embed">Embed</option>
                <option value="index">Index</option>
                <option value="query">Query</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <RefreshCw className="w-8 h-8 mx-auto text-gray-400 animate-spin" />
                      <p className="text-gray-500 mt-2">Loading transactions...</p>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.transactionId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900">
                          {transaction.transactionId.substring(0, 8)}...
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(transaction.type)}`}>
                          {transaction.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${getStatusColor(transaction.status)}`}>
                          {getStatusIcon(transaction.status)}
                          <span className="text-xs font-medium capitalize">{transaction.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.duration}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.documents}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.accuracy ? (
                          <span className="text-sm font-medium text-green-600">
                            {transaction.accuracy}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Transaction ID</label>
                <p className="mt-1 text-sm font-mono text-gray-900">{selectedTransaction.transactionId}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(selectedTransaction.type)}`}>
                      {selectedTransaction.type.toUpperCase()}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg ${getStatusColor(selectedTransaction.status)}`}>
                      {getStatusIcon(selectedTransaction.status)}
                      <span className="text-xs font-medium capitalize">{selectedTransaction.status}</span>
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Duration</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.duration}ms</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Documents</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.documents}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Accuracy</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTransaction.accuracy ? `${selectedTransaction.accuracy}%` : 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Timestamp</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedTransaction.timestamp).toLocaleString()}
                </p>
              </div>

              {selectedTransaction.metadata.queryText && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Query Text</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedTransaction.metadata.queryText}
                  </p>
                </div>
              )}

              {selectedTransaction.metadata.model && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Model</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.metadata.model}</p>
                </div>
              )}

              {selectedTransaction.metadata.vectorStore && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Vector Store</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.metadata.vectorStore}</p>
                </div>
              )}

              {selectedTransaction.errorMessage && (
                <div>
                  <label className="text-sm font-medium text-red-700">Error Message</label>
                  <p className="mt-1 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    {selectedTransaction.errorMessage}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
