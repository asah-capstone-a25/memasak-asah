// web/src/components/campaigns/CampaignUploadForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUploadCampaign } from '@/lib/hooks/use-campaigns';

interface CampaignUploadFormProps {
  onClose?: () => void;
  onSuccess?: (campaignId: string) => void;
}

export function CampaignUploadForm({ onClose, onSuccess }: CampaignUploadFormProps) {
  const router = useRouter();
  const { uploadCampaign, uploading } = useUploadCampaign();
  
  const [campaignName, setCampaignName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setError('');
    } else {
      setError('Please upload a valid CSV file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please upload a valid CSV file');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaignName.trim()) {
      setError('Campaign name is required');
      return;
    }
    
    if (!file) {
      setError('Please upload a CSV file');
      return;
    }

    try {
      setError('');
      const campaign = await uploadCampaign(file, campaignName.trim());
      
      // Success callback or redirect
      if (onSuccess) {
        onSuccess(campaign.id);
      } else {
        router.push(`/campaigns/${campaign.id}`);
      }
    } catch (err) {
      // Error is already handled in the hook
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Upload Campaign</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            disabled={uploading}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name *
          </label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="e.g. Q4 2024 Marketing Campaign"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={uploading}
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CSV File *
          </label>
          
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-primary-400'
              }`}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Drag & drop your CSV file here, or
              </p>
              <label className="inline-block">
                <span className="text-primary-500 hover:text-primary-600 cursor-pointer font-medium">
                  browse files
                </span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Max file size: 10MB | Max rows: 1000
              </p>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-primary-500" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={uploading}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <strong>Required CSV columns:</strong> age, job, marital, education, default, 
            balance, housing, loan, contact, day, month, campaign, pdays, previous, poutcome
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          {onClose && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" loading={uploading} disabled={uploading}>
            {uploading ? 'Uploading & Scoring...' : 'Upload & Score'}
          </Button>
        </div>
      </form>
    </div>
  );
}