'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send, Upload, FileText, AlertCircle, CheckCircle,
  X, PaperclipIcon, Loader2, Search, HelpCircle
} from 'lucide-react';

interface RFP {
  id: string;
  rfpNumber: string;
  title: string;
}

interface QueryForm {
  rfpId: string;
  category: string;
  queryText: string;
  attachments: File[];
}

const CATEGORIES = [
  'Eligibility',
  'Technical Specifications',
  'Commercial Terms',
  'Contractual',
  'General'
];

// Maps the display label shown in the dropdown to the category enum value the backend expects.
const CATEGORY_TO_ENUM: Record<string, string> = {
  'Eligibility': 'eligibility',
  'Technical Specifications': 'technical',
  'Commercial Terms': 'commercial',
  'Contractual': 'contractual',
  'General': 'general'
};

export default function QuerySubmissionPage() {
  const router = useRouter();
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [formData, setFormData] = useState<QueryForm>({
    rfpId: '',
    category: 'Technical Specifications',
    queryText: '',
    attachments: []
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchRFPs();
  }, []);

  const fetchRFPs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendors/rfps`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setRfps(data.filter((rfp: any) => rfp.status === 'open'));
    } catch (err) {
      setError('Failed to load RFPs');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles]
      }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles]
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');

      // Note: attachments are not yet sent — the backend has no file upload
      // endpoint for query attachments yet (Phase 2).
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/queries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rfpId: formData.rfpId,
          category: CATEGORY_TO_ENUM[formData.category],
          queryText: formData.queryText
        })
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          rfpId: '',
          category: 'Technical Specifications',
          queryText: '',
          attachments: []
        });
        
        setTimeout(() => {
          router.push('/vendor/dashboard');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to submit query');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Send className="w-8 h-8 text-nhai-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Submit Query</h1>
              <p className="text-sm text-gray-600">Ask questions about tender documents</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Query Submitted Successfully!</p>
              <p className="text-sm text-green-700 mt-1">
                Redirecting to dashboard...
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Query Form */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* RFP Selection */}
            <div>
              <label className="label">
                <FileText className="w-4 h-4 inline mr-2" />
                Select RFP
              </label>
              <select
                required
                value={formData.rfpId}
                onChange={(e) => setFormData({...formData, rfpId: e.target.value})}
                className="input"
                disabled={loading}
              >
                <option value="">-- Select an RFP --</option>
                {rfps.map((rfp) => (
                  <option key={rfp.id} value={rfp.id}>
                    {rfp.rfpNumber} - {rfp.title}
                  </option>
                ))}
              </select>
              {loading && (
                <p className="text-sm text-gray-500 mt-1">Loading RFPs...</p>
              )}
            </div>

            {/* Category Selection */}
            <div>
              <label className="label">
                <HelpCircle className="w-4 h-4 inline mr-2" />
                Query Category
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="input"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Query Text */}
            <div>
              <label className="label">
                <Search className="w-4 h-4 inline mr-2" />
                Your Query
              </label>
              <textarea
                required
                value={formData.queryText}
                onChange={(e) => setFormData({...formData, queryText: e.target.value})}
                className="input min-h-[150px] resize-y"
                placeholder="Describe your query in detail..."
                maxLength={2000}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.queryText.length} / 2000 characters
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label className="label">
                <Upload className="w-4 h-4 inline mr-2" />
                Attachments (Optional)
              </label>
              
              {/* Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-nhai-primary bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Drag & drop files here, or click to browse
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  PDF, DOC, DOCX, XLS, XLSX (Max 10MB each)
                </p>
                <p className="text-xs text-amber-600 mb-3">
                  ▸ File upload is not yet wired to the backend (Phase 2) — selected files are shown below but not submitted with the query.
                </p>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block btn btn-secondary cursor-pointer"
                >
                  Browse Files
                </label>
              </div>

              {/* File List */}
              {formData.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Selected Files ({formData.attachments.length})
                  </p>
                  {formData.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <PaperclipIcon className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/vendor/dashboard')}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.rfpId || !formData.queryText}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Query
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Query Submission Guidelines</p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>Be specific and clear in your query</li>
                <li>Reference relevant sections of the RFP document</li>
                <li>Attach supporting documents if necessary</li>
                <li>You'll receive a response within 3-5 business days</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
