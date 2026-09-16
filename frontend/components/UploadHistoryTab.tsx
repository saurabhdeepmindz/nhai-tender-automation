'use client';

import React from 'react';
import { History, Upload, User, Package, HardDrive, CheckCircle, AlertCircle } from 'lucide-react';
import { useUploadHistory } from '@/hooks/use-historical-data';
import { UploadType } from '@/types/historical-data.types';

export function UploadHistoryTab() {
  const { data, loading, error } = useUploadHistory(1, 20);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUploadTypeIcon = (type: UploadType) => {
    switch (type) {
      case UploadType.SINGLE:
        return <Upload className="w-5 h-5 text-blue-600" />;
      case UploadType.BULK:
        return <Package className="w-5 h-5 text-purple-600" />;
      case UploadType.AUTO:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  const getUploadTypeBadge = (type: UploadType) => {
    const styles = {
      [UploadType.SINGLE]: 'bg-blue-100 text-blue-800',
      [UploadType.BULK]: 'bg-purple-100 text-purple-800',
      [UploadType.AUTO]: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type]}`}>
        {type}
      </span>
    );
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <History className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload History Timeline
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Complete audit trail of all uploads including user attribution, file counts, sizes,
              and success rates.
            </p>
            <p className="text-sm text-gray-600">
              <strong>Track:</strong> Single uploads, bulk uploads, and system auto-uploads with
              detailed metrics for each operation.
            </p>
          </div>
        </div>
      </div>

      {/* Upload History Timeline */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-red-600">
            <p>Error: {error}</p>
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <History className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg">No upload history yet</p>
            <p className="text-sm">Upload history will appear here</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-[2.5rem] top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* Timeline Items */}
            <div className="divide-y divide-gray-200">
              {data.data.map((item, index) => (
                <div
                  key={item.id}
                  className="relative p-6 hover:bg-gray-50 transition-colors"
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-8 w-5 h-5 bg-white border-4 border-indigo-600 rounded-full" />

                  {/* Content */}
                  <div className="ml-16">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getUploadTypeIcon(item.uploadType)}
                          <h4 className="text-lg font-semibold text-gray-900">{item.title}</h4>
                          {getUploadTypeBadge(item.uploadType)}
                        </div>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(item.uploadTime)}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {/* User */}
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{item.uploadedBy}</span>
                      </div>

                      <span className="text-gray-300">•</span>

                      {/* File Count */}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Package className="w-4 h-4" />
                        <span>{item.fileCount} file{item.fileCount !== 1 ? 's' : ''}</span>
                      </div>

                      <span className="text-gray-300">•</span>

                      {/* Size */}
                      <div className="flex items-center gap-2 text-gray-600">
                        <HardDrive className="w-4 h-4" />
                        <span>{formatFileSize(item.totalSize)}</span>
                      </div>

                      <span className="text-gray-300">•</span>

                      {/* Success Rate */}
                      <div className="flex items-center gap-2">
                        {item.successRate === 100 ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        )}
                        <span className={`font-semibold ${getSuccessRateColor(item.successRate)}`}>
                          {item.successRate.toFixed(1)}% Success
                        </span>
                      </div>
                    </div>

                    {/* Success Rate Progress Bar */}
                    {item.successRate < 100 && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              item.successRate >= 95
                                ? 'bg-green-600'
                                : item.successRate >= 80
                                ? 'bg-yellow-600'
                                : 'bg-red-600'
                            }`}
                            style={{ width: `${item.successRate}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {data && data.data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-600">Total Uploads</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.data.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-600">Total Files</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {data.data.reduce((sum, item) => sum + item.fileCount, 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <HardDrive className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-600">Total Size</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatFileSize(data.data.reduce((sum, item) => sum + item.totalSize, 0))}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-600">Avg Success Rate</h4>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {(
                data.data.reduce((sum, item) => sum + item.successRate, 0) / data.data.length
              ).toFixed(1)}
              %
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
