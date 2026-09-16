'use client';

import React from 'react';
import { FileText, MessageSquare, FileEdit, Eye, TrendingUp } from 'lucide-react';
import { useLiveData } from '@/hooks/use-historical-data';
import { HistoricalDataType } from '@/types/historical-data.types';

export function LiveDataTab() {
  const { data, loading, error } = useLiveData({ page: 1, limit: 20 });

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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Live Data (Post Go-Live)
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              This section displays data automatically generated after the system went live,
              including AI-generated responses and corrigenda.
            </p>
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Live data cannot be deleted and is read-only to maintain
              system integrity and audit trail.
            </p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-red-600">
            <p>Error: {error}</p>
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <TrendingUp className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg">No live data yet</p>
            <p className="text-sm">Live data will appear here after system go-live</p>
          </div>
        ) : (
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
                    Generated Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Accuracy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    References
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${item.accuracyPercentage}%` }}
                          />
                        </div>
                        <span className="font-semibold text-green-600 min-w-[3rem] text-right">
                          {item.accuracyPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-semibold">{item.aiReferences}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statistics Summary */}
      {data && data.data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-600">New RFPs</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {data.data.filter((item) => item.type === HistoricalDataType.RFP).length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-600">AI Responses</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {data.data.filter((item) => item.type === HistoricalDataType.QA).length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileEdit className="w-5 h-5 text-orange-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-600">AI Corrigenda</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {data.data.filter((item) => item.type === HistoricalDataType.CORRIGENDUM).length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
