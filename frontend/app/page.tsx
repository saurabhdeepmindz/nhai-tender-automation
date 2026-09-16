'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Database, FileText, Settings, TrendingUp, Workflow, Layout } from 'lucide-react';

const DESIGN_PREVIEWS = [
  { file: 'screen_06_admin_dashboard.html', label: 'Admin Dashboard' },
  { file: 'screen_08_document_generation.html', label: 'Document Generation' },
  { file: 'screen_09_analytics_dashboard.html', label: 'Analytics Dashboard' },
  { file: 'screen_10_conformance_checker.html', label: 'Conformance Checker' },
  { file: 'screen_11_corrigendum_generator.html', label: 'Corrigendum Generator' },
  { file: 'screen_12_document_viewer.html', label: 'Document Viewer' },
  { file: 'screen_13_help.html', label: 'Help & Documentation' },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            NHAI Tender Automation System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Complete AI-powered solution for managing pre-bid queries and tender automation
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Prebid Queries */}
          <div
            onClick={() => router.push('/prebid-query')}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-t-4 border-blue-500"
          >
            <FileText className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Pre-bid Queries
            </h3>
            <p className="text-gray-600">
              Manage and process vendor queries with AI assistance
            </p>
          </div>

          {/* Admin Panel */}
          <div
            onClick={() => router.push('/admin/dashboard')}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-t-4 border-green-500"
          >
            <Settings className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Admin Panel
            </h3>
            <p className="text-gray-600">
              Control vectorization jobs and system configuration
            </p>
          </div>

          {/* Vector Database */}
          <div
            onClick={() => router.push('/admin/vectorization-control')}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-t-4 border-purple-500"
          >
            <Database className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Vector Database
            </h3>
            <p className="text-gray-600">
              ChromaDB integration for semantic search
            </p>
          </div>

          {/* Analytics */}
          <div
            onClick={() => router.push('/admin/vectorization-control')}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-t-4 border-orange-500"
          >
            <TrendingUp className="w-12 h-12 text-orange-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Analytics
            </h3>
            <p className="text-gray-600">
              Monitor system performance and query statistics
            </p>
          </div>

          {/* Workflow Tracker */}
          <div
            onClick={() => router.push('/prebid-query/workflow')}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-t-4 border-indigo-500"
          >
            <Workflow className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Workflow Tracker
            </h3>
            <p className="text-gray-600">
              Track Chief Engineer Agent query processing in real time
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">4</div>
              <div className="text-gray-600">Active Services</div>
              <div className="text-sm text-gray-500 mt-1">
                Backend, Frontend, Screen 7, Screen 8
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">5</div>
              <div className="text-gray-600">Total Queries</div>
              <div className="text-sm text-gray-500 mt-1">
                Pending vectorization
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">AI</div>
              <div className="text-gray-600">RAG Pipeline</div>
              <div className="text-sm text-gray-500 mt-1">
                Ollama + ChromaDB
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="http://localhost:3000/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-900">Backend API Docs</span>
              <span className="text-sm text-gray-500">Port 3000</span>
            </a>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-900">Screen 7 API Docs</span>
              <span className="text-sm text-gray-500">Port 8000</span>
            </a>
            <a
              href="http://localhost:8001/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-900">Screen 8 API Docs</span>
              <span className="text-sm text-gray-500">Port 8001</span>
            </a>
            <a
              href="http://localhost:3000/api/admin/vectorization/stats"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-900">Vectorization Stats</span>
              <span className="text-sm text-gray-500">API Endpoint</span>
            </a>
          </div>
        </div>

        {/* Design Previews (static HTML mockups, not implemented features) */}
        <div className="bg-white rounded-lg shadow-lg p-8 mt-12">
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

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p className="mb-2">NHAI Tender Automation System v1.0</p>
          <p className="text-sm">
            Powered by NestJS, Next.js, FastAPI, ChromaDB & Ollama
          </p>
        </div>
      </div>
    </div>
  );
}
