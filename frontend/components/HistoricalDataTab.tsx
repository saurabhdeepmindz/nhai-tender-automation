'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  FileText,
  MessageSquare,
  FileEdit,
  Download,
  Edit,
  Trash2,
  Eye,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useHistoricalData, useAvailableYears } from '@/hooks/use-historical-data';
import { HistoricalDataType, UploadStatus } from '@/types/historical-data.types';

interface HistoricalDataTabProps {
  onUpload: (type: HistoricalDataType) => void;
}

export function HistoricalDataTab({ onUpload }: HistoricalDataTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, loading, error, filters, updateFilters, refetch } = useHistoricalData({
    page: 1,
    limit: 20,
  });
  const { years } = useAvailableYears();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchTerm, page: 1 });
  };

  const handleFilterChange = (key: string, value: any) => {
    updateFilters({ [key]: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
  };

  const getTypeIcon = (type: HistoricalDataType) => {
    switch (type) {
      case HistoricalDataType.RFP:
        return <FileText className="w-5 h-5" />;
      case HistoricalDataType.QA:
        return <MessageSquare className="w-5 h-5" />;
      case HistoricalDataType.CORRIGENDUM:
        return <FileEdit className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: UploadStatus) => {
    const styles = {
      [UploadStatus.PROCESSED]: 'bg-green-100 text-green-800',
      [UploadStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
      [UploadStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [UploadStatus.ERROR]: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Historical Data
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onUpload(HistoricalDataType.RFP)}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-white rounded-lg border-2 border-blue-600 text-blue-600 font-medium hover:bg-blue-600 hover:text-white transition-all duration-200"
          >
            <FileText className="w-5 h-5" />
            <span>Upload RFP Documents</span>
          </button>
          <button
            onClick={() => onUpload(HistoricalDataType.QA)}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-white rounded-lg border-2 border-green-600 text-green-600 font-medium hover:bg-green-600 hover:text-white transition-all duration-200"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Upload Pre-Bid Q&A</span>
          </button>
          <button
            onClick={() => onUpload(HistoricalDataType.CORRIGENDUM)}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-white rounded-lg border-2 border-orange-600 text-orange-600 font-medium hover:bg-orange-600 hover:text-white transition-all duration-200"
          >
            <FileEdit className="w-5 h-5" />
            <span>Upload Corrigenda</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search RFP number, title, keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Type Filter */}
          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value={HistoricalDataType.RFP}>RFP</option>
            <option value={HistoricalDataType.QA}>Q&A</option>
            <option value={HistoricalDataType.CORRIGENDUM}>Corrigendum</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value={UploadStatus.PROCESSED}>Processed</option>
            <option value={UploadStatus.PROCESSING}>Processing</option>
            <option value={UploadStatus.PENDING}>Pending</option>
            <option value={UploadStatus.ERROR}>Error</option>
          </select>
        </div>

        {/* Year Filter */}
        <div className="mt-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-600">Filter by Year:</span>
          <div className="flex gap-2">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => handleFilterChange('year', year)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  filters.year === year
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {year}
              </button>
            ))}
            {filters.year && (
              <button
                onClick={() => handleFilterChange('year', '')}
                className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-red-600">
            <p>Error: {error}</p>
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg">No historical data found</p>
            <p className="text-sm">Upload documents to get started</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RFP Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AI Refs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {item.rfpNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={item.title}>
                          {item.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <span>{item.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.uploadDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold">{item.aiReferences}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(item.fileSize)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(data.page - 1) * data.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(data.page * data.limit, data.total)}
                </span>{' '}
                of <span className="font-medium">{data.total}</span> results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(data.page - 1)}
                  disabled={data.page === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 text-sm font-medium">
                  Page {data.page} of {data.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(data.page + 1)}
                  disabled={data.page === data.totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
