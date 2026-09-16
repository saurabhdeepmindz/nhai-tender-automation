'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { historicalDataApi } from '@/services/historical-data.service';
import { HistoricalDataType, UploadFormData } from '@/types/historical-data.types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadType: HistoricalDataType;
  onSuccess: () => void;
}

export function UploadModal({ isOpen, onClose, uploadType, onSuccess }: UploadModalProps) {
  const [formData, setFormData] = useState<UploadFormData>({
    rfpNumber: '',
    title: '',
    type: uploadType,
    category: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (50MB max)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Allowed: PDF, DOCX, TXT, CSV, XLS, XLSX');
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.rfpNumber.trim()) {
      setError('RFP Number is required');
      return;
    }

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      await historicalDataApi.uploadFile({
        ...formData,
        file,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      rfpNumber: '',
      title: '',
      type: uploadType,
      category: '',
    });
    setFile(null);
    setError(null);
    setSuccess(false);
    onClose();
  };

  const getTypeLabel = () => {
    switch (uploadType) {
      case HistoricalDataType.RFP:
        return 'RFP Document';
      case HistoricalDataType.QA:
        return 'Pre-Bid Q&A';
      case HistoricalDataType.CORRIGENDUM:
        return 'Corrigendum';
    }
  };

  const getTypeColor = () => {
    switch (uploadType) {
      case HistoricalDataType.RFP:
        return 'blue';
      case HistoricalDataType.QA:
        return 'green';
      case HistoricalDataType.CORRIGENDUM:
        return 'orange';
    }
  };

  const color = getTypeColor();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b bg-${color}-50`}>
          <h2 className="text-xl font-semibold text-gray-900">Upload {getTypeLabel()}</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">File uploaded successfully!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File <span className="text-red-600">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors
                ${
                  file
                    ? `border-${color}-600 bg-${color}-50`
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.docx,.txt,.csv,.xls,.xlsx"
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className={`w-12 h-12 text-${color}-600`} />
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-12 h-12 text-gray-400" />
                  <p className="font-medium text-gray-900">Click to upload</p>
                  <p className="text-sm text-gray-500">
                    PDF, DOCX, TXT, CSV, XLS, XLSX (max 50MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RFP Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RFP Number <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.rfpNumber}
              onChange={(e) => setFormData({ ...formData, rfpNumber: e.target.value })}
              placeholder="e.g., RFP-2023-NH-145"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title / Description <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Mumbai-Pune Expressway Project"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category (Optional)
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Highway Construction"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || success}
              className={`
                px-6 py-2 bg-${color}-600 text-white rounded-lg 
                hover:bg-${color}-700 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2
              `}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Uploaded!</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload File</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
