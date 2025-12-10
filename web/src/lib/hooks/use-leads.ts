// web/src/lib/hooks/use-leads.ts
'use client';

import { useState, useEffect } from 'react';
import { apiClient, getErrorMessage } from '@/lib/api/api-client';
import type { LeadListItem, Lead } from '@/types';

interface UseLeadsResult {
  leads: LeadListItem[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    totalCount: number;
  };
  setPage: (page: number) => void;
  setFilters: (filters: LeadFilters) => void;
}

interface LeadFilters {
  riskLevel?: string;
  minProbability?: number;
  maxProbability?: number;
}

/**
 * Hook to fetch leads for a campaign
 */
export function useLeads(campaignId: string): UseLeadsResult {
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<LeadFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
  });

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {
          page,
          pageSize: 20,
          sortBy: 'probability',
          sortOrder: 'desc',
          ...filters,
        };

        const response = await apiClient.get(`/campaigns/${campaignId}/leads`, {
          params,
        });

        setLeads(response.data.data || []);
        setPagination(response.data.pagination);
      } catch (err) {
        setError(getErrorMessage(err));
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchLeads();
    }
  }, [campaignId, page, filters]);

  return {
    leads,
    loading,
    error,
    pagination,
    setPage,
    setFilters,
  };
}

/**
 * Hook to fetch single lead detail
 */
export function useLead(leadId: string) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get(`/leads/${leadId}`);
        setLead(response.data.data);
      } catch (err) {
        setError(getErrorMessage(err));
        setLead(null);
      } finally {
        setLoading(false);
      }
    };

    if (leadId) {
      fetchLead();
    }
  }, [leadId]);

  return { lead, loading, error };
}