'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  Cpu, 
  Save, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface RAGConfig {
  llmProvider: string;
  llmModel: string;
  embeddingModel: string;
  vectorStore: string;
  chunkSize: number;
  chunkOverlap: number;
  temperature: number;
  maxTokens: number;
  topK: number;
  similarityThreshold: number;
}

export default function RAGConfigurationPage() {
  const [config, setConfig] = useState<RAGConfig>({
    llmProvider: 'ollama',
    llmModel: 'llama2',
    embeddingModel: 'nomic-embed-text',
    vectorStore: 'chromadb',
    chunkSize: 1000,
    chunkOverlap: 200,
    temperature: 0.1,
    maxTokens: 2000,
    topK: 5,
    similarityThreshold: 0.7,
  });

  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    llm: true,
    embedding: true,
    vectorStore: true,
    retrieval: true,
  });

  useEffect(() => {
    // Load configuration from API
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    try {
      const response = await fetch('/api/rag-config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/rag-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        alert('Configuration saved successfully!');
      } else {
        alert('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);

    try {
      const response = await fetch('/api/rag-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionStatus('error');
    } finally {
      setTestingConnection(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RAG Configuration</h1>
                <p className="text-sm text-gray-600">Configure LLM, embeddings, and vector store settings</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${testingConnection ? 'animate-spin' : ''}`} />
                Test Connection
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>

          {/* Connection Status */}
          {connectionStatus && (
            <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${
              connectionStatus === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {connectionStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Connection successful! All services are operational.</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span>Connection failed. Please check your configuration.</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* LLM Configuration */}
          <div className="bg-white rounded-lg border">
            <button
              onClick={() => toggleSection('llm')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">LLM Configuration</h2>
              </div>
              {expandedSections.llm ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.llm && (
              <div className="px-6 pb-6 border-t">
                <div className="grid grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LLM Provider
                    </label>
                    <select
                      value={config.llmProvider}
                      onChange={(e) => setConfig({ ...config, llmProvider: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ollama">Ollama (Local)</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model
                    </label>
                    <select
                      value={config.llmModel}
                      onChange={(e) => setConfig({ ...config, llmModel: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="llama2">Llama 2</option>
                      <option value="llama3">Llama 3</option>
                      <option value="gemma">Gemma</option>
                      <option value="mistral">Mistral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperature (0.0 - 1.0)
                      <span className="ml-2 text-xs text-gray-500">Current: {config.temperature}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.temperature}
                      onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Precise</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      value={config.maxTokens}
                      onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="100"
                      max="4000"
                      step="100"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Embedding Configuration */}
          <div className="bg-white rounded-lg border">
            <button
              onClick={() => toggleSection('embedding')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Embedding Configuration</h2>
              </div>
              {expandedSections.embedding ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.embedding && (
              <div className="px-6 pb-6 border-t">
                <div className="grid grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Embedding Model
                    </label>
                    <select
                      value={config.embeddingModel}
                      onChange={(e) => setConfig({ ...config, embeddingModel: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="nomic-embed-text">Nomic Embed Text</option>
                      <option value="all-minilm">All-MiniLM-L6-v2</option>
                      <option value="instructor-xl">Instructor-XL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chunk Size
                    </label>
                    <input
                      type="number"
                      value={config.chunkSize}
                      onChange={(e) => setConfig({ ...config, chunkSize: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="500"
                      max="2000"
                      step="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chunk Overlap
                    </label>
                    <input
                      type="number"
                      value={config.chunkOverlap}
                      onChange={(e) => setConfig({ ...config, chunkOverlap: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="500"
                      step="50"
                    />
                  </div>

                  <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg col-span-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <p className="text-sm text-blue-900">
                      Chunk overlap helps maintain context between document chunks. Recommended: 10-20% of chunk size.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vector Store Configuration */}
          <div className="bg-white rounded-lg border">
            <button
              onClick={() => toggleSection('vectorStore')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Vector Store Configuration</h2>
              </div>
              {expandedSections.vectorStore ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.vectorStore && (
              <div className="px-6 pb-6 border-t">
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vector Store Type
                  </label>
                  <select
                    value={config.vectorStore}
                    onChange={(e) => setConfig({ ...config, vectorStore: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="chromadb">ChromaDB (Recommended)</option>
                    <option value="faiss">FAISS</option>
                    <option value="weaviate">Weaviate</option>
                  </select>

                  <div className="mt-4 space-y-3">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">ChromaDB</h3>
                      <p className="text-sm text-gray-600">
                        Open-source vector database optimized for AI applications. Best for production use with persistent storage.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">FAISS</h3>
                      <p className="text-sm text-gray-600">
                        Facebook AI Similarity Search. Excellent for large-scale similarity search with high performance.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Weaviate</h3>
                      <p className="text-sm text-gray-600">
                        Cloud-native vector database with GraphQL API. Best for complex queries and multi-modal data.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Retrieval Configuration */}
          <div className="bg-white rounded-lg border">
            <button
              onClick={() => toggleSection('retrieval')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">Retrieval Configuration</h2>
              </div>
              {expandedSections.retrieval ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.retrieval && (
              <div className="px-6 pb-6 border-t">
                <div className="grid grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Top K Results
                    </label>
                    <input
                      type="number"
                      value={config.topK}
                      onChange={(e) => setConfig({ ...config, topK: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="20"
                    />
                    <p className="text-xs text-gray-500 mt-1">Number of similar documents to retrieve</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Similarity Threshold (0.0 - 1.0)
                      <span className="ml-2 text-xs text-gray-500">Current: {config.similarityThreshold}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.similarityThreshold}
                      onChange={(e) => setConfig({ ...config, similarityThreshold: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Loose Match</span>
                      <span>Exact Match</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button at Bottom */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg font-medium"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving Configuration...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
