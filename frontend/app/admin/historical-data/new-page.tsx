'use client';

import React, { useState } from 'react';
import { ArrowLeft, Database, Activity, TrendingUp, FileText, History as HistoryIcon } from 'lucide-react';
import Link from 'next/link';
import { useStatistics } from '@/hooks/use-historical-data';
import { StatisticsCard } from '@/components/StatisticsCard';
import { HistoricalDataTab } from '@/components/HistoricalDataTab';
import { LiveDataTab } from '@/components/LiveDataTab';
import { MostReferencedTab } from '@/components/MostReferencedTab';
import { UploadHistoryTab } from '@/components/UploadHistoryTab';
import { UploadModal } from '@/components/UploadModal';
import { HistoricalDataType } from '@/types/historical-data.types';

type TabType = 'historical' | 'live' | 'referenced' | 'history';

export default function HistoricalDataManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('historical');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<HistoricalDataType>(HistoricalDataType.RFP);
  
  const { data: statistics, loading: statsLoading, refetch: refetchStats } = useStatistics();

  const handleUploadClick = (type: HistoricalDataType) => {
    setUploadType(type);
    setUploadModalOpen(true);
  };

  const handleUploadSuccess = () => {
    refetchStats();
    // Additional refetch logic based on active tab
  };

  const tabs = [
    {
      id: 'historical' as TabType,
      label: 'Historical Data',
      icon: Database,
      description: 'Pre Go-Live',
    },
    {
      id: 'live' as TabType,
      label: 'Live Data',
      icon: Activity,
      description: 'Post Go-Live',
    },
    {
      id: 'referenced' as TabType,
      label: 'Most Referenced',
      icon: TrendingUp,
      description: 'Top 25',
    },
    {
      id: 'history' as TabType,
      label: 'Upload History',
      icon: HistoryIcon,
      description: 'Timeline',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side */}
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">NH</span>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    NHAI Tender Query Automation
                  </h1>
                  <p className="text-sm text-gray-500">Historical Data Management System</p>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
              
              {/* User Profile */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">AU</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Historical Data Management</h2>
              <p className="text-gray-600 mt-1">
                Manage historical RFPs, Q&A, and corrigenda that power AI responses
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-48 bg-white rounded-lg shadow-md animate-pulse"
              />
            ))}
          </div>
        ) : statistics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatisticsCard
              data={statistics.historicalData}
              icon={Database}
              color="blue"
            />
            <StatisticsCard
              data={statistics.liveData}
              icon={Activity}
              color="green"
            />
            <StatisticsCard
              data={statistics.totalKnowledgeBase}
              icon={FileText}
              color="orange"
            />
            <StatisticsCard
              data={statistics.aiReferencesUsed}
              icon={TrendingUp}
              color="purple"
            />
          </div>
        ) : null}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-3 px-6 py-4 border-b-2 transition-all
                      whitespace-nowrap
                      ${
                        isActive
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs opacity-75">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'historical' && (
              <HistoricalDataTab onUpload={handleUploadClick} />
            )}
            {activeTab === 'live' && <LiveDataTab />}
            {activeTab === 'referenced' && <MostReferencedTab />}
            {activeTab === 'history' && <UploadHistoryTab />}
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        uploadType={uploadType}
        onSuccess={handleUploadSuccess}
      />

      {/* Footer Navigation */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-medium">Screen:</span>
              <span>Historical Data Management</span>
              <span className="text-gray-400">|</span>
              <span>Previous:</span>
              <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800">
                Admin Dashboard
              </Link>
            </div>
            <Link
              href="/admin/pre-bid-query"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <span>Next: Pre-bid Query Management</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
