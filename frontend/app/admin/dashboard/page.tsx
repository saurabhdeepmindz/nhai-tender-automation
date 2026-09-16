'use client';

import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Database, MessageSquare, Workflow,
  FolderOpen, Layout
} from 'lucide-react';

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  borderClass: string;
  iconClass: string;
}

const DESIGN_PREVIEWS = [
  { file: 'screen_06_admin_dashboard.html', label: 'Admin Dashboard' },
  { file: 'screen_08_document_generation.html', label: 'Document Generation' },
  { file: 'screen_09_analytics_dashboard.html', label: 'Analytics Dashboard' },
  { file: 'screen_10_conformance_checker.html', label: 'Conformance Checker' },
  { file: 'screen_11_corrigendum_generator.html', label: 'Corrigendum Generator' },
  { file: 'screen_12_document_viewer.html', label: 'Document Viewer' },
  { file: 'screen_13_help.html', label: 'Help & Documentation' },
];

export default function AdminDashboard() {
  const router = useRouter();

  const features: FeatureCard[] = [
    {
      icon: <Database className="w-8 h-8" />,
      title: 'Vectorization Control',
      description: 'Monitor and manage query vectorization jobs',
      onClick: () => router.push('/admin/vectorization-control'),
      borderClass: 'border-blue-500',
      iconClass: 'text-blue-600',
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: 'Pre-bid Query Management',
      description: 'Review and respond to vendor pre-bid queries',
      onClick: () => router.push('/admin/prebid-queries'),
      borderClass: 'border-green-500',
      iconClass: 'text-green-600',
    },
    {
      icon: <Workflow className="w-8 h-8" />,
      title: 'Query Workflow Tracker',
      description: 'Track Chief Engineer Agent query processing in real time',
      onClick: () => router.push('/admin/prebid-queries/workflow'),
      borderClass: 'border-purple-500',
      iconClass: 'text-purple-600',
    },
    {
      icon: <FolderOpen className="w-8 h-8" />,
      title: 'Historical Data Management',
      description: 'Upload and manage RFP, Q&A, and corrigendum documents',
      onClick: () => router.push('/admin/historical-data'),
      borderClass: 'border-orange-500',
      iconClass: 'text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-nhai-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">NHAI Tender Automation — Admin Tools</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature) => (
            <div
              key={feature.title}
              onClick={feature.onClick}
              className={`bg-white rounded-lg shadow-md p-6 border-t-4 ${feature.borderClass} hover:shadow-lg transition-shadow cursor-pointer`}
            >
              <div className={`${feature.iconClass} mb-4`}>{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Design Previews (static HTML mockups, not implemented features) */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Design Previews</h2>
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-6">
            ⚠️ These are static HTML design mockups only — no backend, no live data. For visual/UX reference.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DESIGN_PREVIEWS.map((preview) => (
              <a
                key={preview.file}
                href={`/mockups/${preview.file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Layout className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <span className="font-medium text-gray-900">{preview.label}</span>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
