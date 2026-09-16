'use client';

import React from 'react';
import { TrendingUp, FileText, MessageSquare, FileEdit, Clock, Calendar } from 'lucide-react';
import { useMostReferenced } from '@/hooks/use-historical-data';
import { HistoricalDataType } from '@/types/historical-data.types';

export function MostReferencedTab() {
  const { data, loading, error } = useMostReferenced(25);

  const getTypeIcon = (type: HistoricalDataType) => {
    switch (type) {
      case HistoricalDataType.RFP:
        return <FileText className="w-5 h-5 text-blue-600" />;
      case HistoricalDataType.QA:
        return <MessageSquare className="w-5 h-5 text-green-600" />;
      case HistoricalDataType.CORRIGENDUM:
        return <FileEdit className="w-5 h-5 text-orange-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Most Referenced Documents
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              These are the top 25 documents most frequently used by the AI for generating
              responses. High reference counts indicate valuable, high-quality data.
            </p>
            <p className="text-sm text-gray-600">
              <strong>Use Case:</strong> Identify valuable data patterns and upload similar
              content to improve AI response quality.
            </p>
          </div>
        </div>
      </div>

      {/* Referenced Items */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-red-600">
            <p>Error: {error}</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <TrendingUp className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg">No referenced documents yet</p>
            <p className="text-sm">Documents will appear here as AI uses them</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data.map((item, index) => (
              <div
                key={`${item.rfpNumber}-${index}`}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left Side - Document Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      {/* Rank Badge */}
                      <div
                        className={`
                          flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg
                          ${
                            index < 3
                              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }
                        `}
                      >
                        {index + 1}
                      </div>

                      {/* Document Details */}
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.rfpNumber}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">{item.title}</p>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            {getTypeIcon(item.type)}
                            <span>{item.packageType}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Last used: {formatDate(item.lastUsed)}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Uploaded: {formatDate(item.uploadDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Statistics */}
                  <div className="flex flex-col gap-3">
                    {/* Reference Count */}
                    <div className="bg-blue-50 rounded-lg px-4 py-3 text-center min-w-[120px]">
                      <div className="text-3xl font-bold text-blue-600">
                        {item.referenceCount}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">References</div>
                    </div>

                    {/* Accuracy */}
                    <div className="bg-green-50 rounded-lg px-4 py-3 text-center min-w-[120px]">
                      <div className="text-3xl font-bold text-green-600">
                        {item.accuracyPercentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Accuracy</div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">AI Usage Intensity</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index < 3
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                          : index < 10
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                          : 'bg-blue-600'
                      }`}
                      style={{
                        width: `${Math.min((item.referenceCount / data[0].referenceCount) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Total References</h4>
            <p className="text-2xl font-bold text-gray-900">
              {data.reduce((sum, item) => sum + item.referenceCount, 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Average Accuracy</h4>
            <p className="text-2xl font-bold text-green-600">
              {(
                data.reduce((sum, item) => sum + item.accuracyPercentage, 0) / data.length
              ).toFixed(1)}
              %
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Top Document</h4>
            <p className="text-2xl font-bold text-blue-600">{data[0].referenceCount}</p>
            <p className="text-xs text-gray-500 mt-1">references</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Documents Shown</h4>
            <p className="text-2xl font-bold text-gray-900">{data.length}</p>
            <p className="text-xs text-gray-500 mt-1">of top 25</p>
          </div>
        </div>
      )}
    </div>
  );
}
