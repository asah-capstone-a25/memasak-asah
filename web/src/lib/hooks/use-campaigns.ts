// web/src/lib/hooks/use-campaigns.ts
'use client';

import { useState, useEffect } from 'react';
import { apiClient, getErrorMessage } from '@/lib/api/api-client';
import type { CampaignSummary } from '@/types';

interface UseCampaignsResult {
  campaigns: CampaignSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch campaigns list
 */
export function useCampaigns(limit = 50): UseCampaignsResult {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/campaigns', {
        params: { limit },
      });
      
      setCampaigns(response.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [limit]);

  return {
    campaigns,
    loading,
    error,
    refetch: fetchCampaigns,
  };
}

/**
 * Hook to upload campaign
 */
export function useUploadCampaign() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadCampaign = async (file: File, name: string) => {
    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);

      const response = await apiClient.post('/campaigns/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data.campaign;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadCampaign,
    uploading,
    error,
  };
}