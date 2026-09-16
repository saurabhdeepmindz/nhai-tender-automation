'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Workflow,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Eye,
  FileText,
  Search,
  Database,
  Bot,
  Shield,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface WorkflowStep {
  stepNumber: number;
  name: string;
  status: 'completed' | 'in-progress' | 'pending' | 'failed';
  duration?: number;
  startTime?: string;
  endTime?: string;
  output?: string;
  error?: string;
}

interface WorkflowExecution {
  executionId: string;
  queryId: string;
  queryText: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  totalDuration?: number;
  steps: WorkflowStep[];
  finalResponse?: string;
  confidence?: number;
}

interface SimilarQuery {
  query_id: string;
  query_text: string;
  response_text: string;
  similarity_score: number;
  rfp_number: string;
  category?: string;
  answered_at?: string | null;
}

export default function ChiefEngineerWorkflowPage() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [similarQueries, setSimilarQueries] = useState<SimilarQuery[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const workflowSteps = [
    {
      number: 1,
      name: 'Analyze Query with RFP Context',
      icon: FileText,
      color: 'blue',
      description: 'Extract intent and identify RFP sections'
    },
    {
      number: 2,
      name: 'Retrieve Historical Documents',
      icon: Database,
      color: 'green',
      description: 'Search vectorstore for similar past RFPs and Q&A'
    },
    {
      number: 3,
      name: 'Retrieve Similar Pre-bid Queries',
      icon: Search,
      color: 'purple',
      description: 'Find similar queries from historical data'
    },
    {
      number: 4,
      name: 'Generate Comprehensive Response',
      icon: Bot,
      color: 'orange',
      description: 'Use LLM to create draft response with context'
    },
    {
      number: 5,
      name: 'Validate Response Quality',
      icon: Shield,
      color: 'red',
      description: 'Check accuracy, completeness, and relevance'
    },
    {
      number: 6,
      name: 'Finalize with References',
      icon: Sparkles,
      color: 'indigo',
      description: 'Add source citations and confidence score'
    }
  ];

  useEffect(() => {
    fetchExecutions();

    // Auto-refresh every 5 seconds if enabled
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchExecutions();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchExecutions = async () => {
    try {
      const response = await fetch('/api/prebid-queries/workflow/executions');
      if (response.ok) {
        const { data } = await response.json();
        setExecutions(data);
        
        // Auto-select first running or most recent execution
        if (!selectedExecution && data.length > 0) {
          const running = data.find((e: WorkflowExecution) => e.status === 'running');
          setSelectedExecution(running || data[0]);
        } else if (selectedExecution) {
          // Update selected execution if it exists
          const updated = data.find((e: WorkflowExecution) => e.executionId === selectedExecution.executionId);
          if (updated) {
            setSelectedExecution(updated);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching executions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExecution?.queryText) {
      fetchSimilarQueries(selectedExecution.queryText);
    } else {
      setSimilarQueries([]);
    }
  }, [selectedExecution?.executionId]);

  const fetchSimilarQueries = async (queryText: string) => {
    setLoadingSimilar(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_RAG_PREBID_URL}/chief-engineer/similar-queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query_text: queryText, top_k: 5 })
      });
      if (response.ok) {
        const data = await response.json();
        setSimilarQueries(data.similar_queries || []);
      } else {
        setSimilarQueries([]);
      }
    } catch (error) {
      console.error('Error fetching similar queries:', error);
      setSimilarQueries([]);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6" />;
      case 'in-progress':
        return <Clock className="w-6 h-6 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-6 h-6" />;
      default:
        return <Circle className="w-6 h-6" />;
    }
  };

  const getStepColor = (status: string, baseColor: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in-progress':
        return `bg-${baseColor}-100 text-${baseColor}-800 border-${baseColor}-300 animate-pulse`;
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-400 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Workflow className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chief Engineer Workflow</h1>
                <p className="text-sm text-gray-600">Real-time 6-step AI workflow visualization</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Auto-refresh (5s)
              </label>
              <button
                onClick={fetchExecutions}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Executions List - Left Side */}
          <div className="col-span-4">
            <div className="bg-white rounded-lg border">
              <div className="px-4 py-3 border-b">
                <h2 className="font-semibold text-gray-900">Recent Executions</h2>
                <p className="text-sm text-gray-500">{executions.length} total</p>
              </div>
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                {executions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Workflow className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No workflow executions yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {executions.map((execution) => (
                      <button
                        key={execution.executionId}
                        onClick={() => setSelectedExecution(execution)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          selectedExecution?.executionId === execution.executionId
                            ? 'bg-blue-50 border-l-4 border-blue-600'
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(execution.status)}`}>
                            {execution.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(execution.startTime).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 line-clamp-2 mb-2">
                          {execution.queryText}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>ID: {execution.executionId.substring(0, 8)}</span>
                          {execution.totalDuration && (
                            <span>{(execution.totalDuration / 1000).toFixed(1)}s</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Workflow Visualization - Right Side */}
          <div className="col-span-8">
            {!selectedExecution ? (
              <div className="bg-white rounded-lg border p-12 text-center">
                <Eye className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 text-lg">Select an execution to view workflow details</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Execution Info Card */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">Execution Details</h3>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedExecution.status)}`}>
                          {selectedExecution.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{selectedExecution.queryText}</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Execution ID:</span>
                          <p className="font-mono text-gray-900">{selectedExecution.executionId.substring(0, 12)}...</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Started:</span>
                          <p className="text-gray-900">{new Date(selectedExecution.startTime).toLocaleString()}</p>
                        </div>
                        {selectedExecution.totalDuration && (
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <p className="text-gray-900 font-semibold">{(selectedExecution.totalDuration / 1000).toFixed(2)}s</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workflow Steps */}
                <div className="space-y-4">
                  {workflowSteps.map((step, index) => {
                    const stepData = selectedExecution.steps[index];
                    const isActive = stepData?.status === 'in-progress';
                    const isCompleted = stepData?.status === 'completed';
                    const isFailed = stepData?.status === 'failed';

                    return (
                      <div key={step.number} className="bg-white rounded-lg border overflow-hidden">
                        <div className={`p-4 border-l-4 ${
                          isFailed ? 'border-red-500' :
                          isActive ? 'border-blue-500' :
                          isCompleted ? 'border-green-500' :
                          'border-gray-300'
                        }`}>
                          <div className="flex items-center gap-4">
                            {/* Step Icon */}
                            <div className={`p-3 rounded-lg border-2 ${
                              getStepColor(stepData?.status || 'pending', step.color)
                            }`}>
                              <step.icon className="w-6 h-6" />
                            </div>

                            {/* Step Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-semibold text-gray-900">
                                  Step {step.number}: {step.name}
                                </h4>
                                {stepData && (
                                  <div className={`flex items-center gap-1 ${
                                    isFailed ? 'text-red-600' :
                                    isActive ? 'text-blue-600' :
                                    isCompleted ? 'text-green-600' :
                                    'text-gray-400'
                                  }`}>
                                    {getStepIcon(stepData.status)}
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{step.description}</p>

                              {/* Step Details */}
                              {stepData && (
                                <div className="mt-3 space-y-2">
                                  {stepData.duration && (
                                    <p className="text-xs text-gray-500">
                                      Duration: <span className="font-medium">{stepData.duration}ms</span>
                                    </p>
                                  )}

                                  {stepData.output && (
                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                      <p className="text-xs font-medium text-gray-700 mb-1">Output:</p>
                                      <p className="text-sm text-gray-900">{stepData.output}</p>
                                    </div>
                                  )}

                                  {stepData.error && (
                                    <div className="mt-2 p-3 bg-red-50 rounded-lg">
                                      <p className="text-xs font-medium text-red-700 mb-1">Error:</p>
                                      <p className="text-sm text-red-600">{stepData.error}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Arrow to Next Step */}
                            {index < workflowSteps.length - 1 && (
                              <ChevronRight className={`w-6 h-6 ${
                                isCompleted ? 'text-green-500' : 'text-gray-300'
                              }`} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Final Response */}
                {selectedExecution.finalResponse && (
                  <div className="bg-white rounded-lg border">
                    <div className="px-6 py-4 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Final AI Response</h3>
                        {selectedExecution.confidence && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                            {selectedExecution.confidence}% Confidence
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedExecution.finalResponse}</p>
                    </div>
                  </div>
                )}

                {/* Similar Historical Queries */}
                <div className="bg-white rounded-lg border">
                  <div className="px-6 py-4 border-b">
                    <h3 className="font-semibold text-gray-900">Similar Historical Queries</h3>
                    <p className="text-sm text-gray-500">
                      Past pre-bid queries matched by AI semantic similarity, with their approved responses
                    </p>
                  </div>
                  <div className="p-6">
                    {loadingSimilar ? (
                      <div className="text-center py-8 text-gray-500">
                        <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                        Searching historical queries...
                      </div>
                    ) : similarQueries.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No similar historical queries found (similarity threshold: 50%)
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-xs font-medium text-gray-500 uppercase">
                              <th className="pb-2 pr-4">Confidence</th>
                              <th className="pb-2 pr-4">Historical Query</th>
                              <th className="pb-2 pr-4">Response</th>
                              <th className="pb-2 pr-4">RFP</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {similarQueries.map((sq) => (
                              <tr key={sq.query_id}>
                                <td className="py-3 pr-4 align-top">
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full whitespace-nowrap">
                                    {(sq.similarity_score * 100).toFixed(0)}%
                                  </span>
                                </td>
                                <td className="py-3 pr-4 align-top max-w-xs">
                                  <p className="text-gray-900 whitespace-pre-wrap">{sq.query_text}</p>
                                  {sq.category && (
                                    <span className="text-xs text-gray-500">{sq.category}</span>
                                  )}
                                </td>
                                <td className="py-3 pr-4 align-top max-w-md">
                                  <p className="text-gray-700 whitespace-pre-wrap line-clamp-4">{sq.response_text}</p>
                                </td>
                                <td className="py-3 pr-4 align-top text-gray-500 font-mono text-xs whitespace-nowrap">
                                  {sq.rfp_number}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
