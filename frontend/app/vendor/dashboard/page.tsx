'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, FileText, MessageSquare, TrendingUp,
  Clock, CheckCircle, AlertCircle, Plus, Search,
  Filter, Download, Eye, Calendar, BarChart3, Bot
} from 'lucide-react';

interface DashboardStats {
  totalRFPs: number;
  activeRFPs: number;
  queriesSubmitted: number;
  queriesAnswered: number;
  avgResponseTime: string;
  pendingQueries: number;
}

interface RFP {
  id: string;
  rfpNumber: string;
  title: string;
  publishedDate: string;
  deadline: string;
  status: 'open' | 'closed';
  queriesCount: number;
}

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

export default function VendorDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rfpStatusFilter, setRfpStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [showRfpFilterMenu, setShowRfpFilterMenu] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [statsRes, rfpsRes, queriesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendors/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendors/rfps`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendors/queries`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      setStats(await statsRes.json());
      setRfps(await rfpsRes.json());
      setQueries(await queriesRes.json());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, title, value, subtitle, color, onClick }: any) => (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'badge badge-success',
      closed: 'badge badge-danger',
      pending: 'badge badge-warning',
      answered: 'badge badge-success',
      clarification_needed: 'badge badge-info'
    };
    return styles[status as keyof typeof styles] || 'badge';
  };

  const filteredRfps = rfps.filter((rfp) => {
    const matchesSearch =
      rfp.rfpNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = rfpStatusFilter === 'all' || rfp.status === rfpStatusFilter;
    return matchesSearch && matchesStatus;
  });
  const displayedRfps = searchTerm || rfpStatusFilter !== 'all' ? filteredRfps : filteredRfps.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nhai-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-nhai-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back! Here's your tender overview</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/mockups/screen_04_chatbot.html"
                target="_blank"
                rel="noopener noreferrer"
                title="Design mockup only — not a live feature yet"
                className="btn btn-secondary flex items-center gap-2"
              >
                <Bot className="w-5 h-5" />
                AI Assistant (Preview)
              </a>
              <button
                onClick={() => router.push('/vendor/query-submission')}
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Submit Query
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<FileText className="w-6 h-6 text-blue-600" />}
            title="Total RFPs"
            value={stats?.totalRFPs || 0}
            subtitle={`${stats?.activeRFPs || 0} active`}
            color="text-blue-600"
          />
          <StatCard
            icon={<MessageSquare className="w-6 h-6 text-green-600" />}
            title="Queries Submitted"
            value={stats?.queriesSubmitted || 0}
            subtitle={`${stats?.queriesAnswered || 0} answered`}
            color="text-green-600"
            onClick={() => router.push('/vendor/query-history')}
          />
          <StatCard
            icon={<Clock className="w-6 h-6 text-orange-600" />}
            title="Pending Queries"
            value={stats?.pendingQueries || 0}
            subtitle="Awaiting response"
            color="text-orange-600"
            onClick={() => router.push('/vendor/query-history?status=pending')}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            title="Avg Response Time"
            value={stats?.avgResponseTime || 'N/A'}
            subtitle="Days"
            color="text-purple-600"
          />
        </div>

        {/* Active RFPs Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-nhai-primary" />
              Active RFPs
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search RFPs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nhai-primary focus:border-transparent"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowRfpFilterMenu((prev) => !prev)}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                {showRfpFilterMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                    {(['all', 'open', 'closed'] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setRfpStatusFilter(option);
                          setShowRfpFilterMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                          rfpStatusFilter === option ? 'font-semibold text-nhai-primary' : 'text-gray-700'
                        }`}
                      >
                        {option === 'all' ? 'All Statuses' : option === 'open' ? 'Open' : 'Closed'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RFP Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Published
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Queries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedRfps.map((rfp) => (
                  <tr key={rfp.id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rfp.rfpNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {rfp.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {new Date(rfp.publishedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {new Date(rfp.deadline).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(rfp.status)}>
                        {rfp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      {rfp.queriesCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => router.push(`/vendor/query-history?rfp=${encodeURIComponent(rfp.rfpNumber)}`)}
                        className="text-nhai-primary hover:text-blue-700 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Queries Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-nhai-primary" />
            Recent Queries
          </h2>

          <div className="space-y-4">
            {queries.slice(0, 5).map((query) => (
              <div
                key={query.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-gray-900">{query.queryNumber}</span>
                      <span className="text-sm text-gray-500">RFP: {query.rfpNumber}</span>
                      <span className={getStatusBadge(query.status)}>{query.status}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{query.queryText}</p>
                    <p className="text-xs text-gray-500">
                      Submitted: {new Date(query.submittedAt).toLocaleString()}
                      {query.answeredAt && ` • Answered: ${new Date(query.answeredAt).toLocaleString()}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedQuery(query)}
                    className="text-nhai-primary hover:text-blue-700"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/vendor/query-history')}
              className="text-nhai-primary hover:text-blue-700 font-medium flex items-center gap-2 mx-auto"
            >
              View All Queries
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
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
