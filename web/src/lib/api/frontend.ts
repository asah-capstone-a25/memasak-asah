// web/src/lib/api/frontend.ts
/**
 * Frontend API service functions
 * These are client-side wrappers for API routes
 */

import { apiClient } from './client';
import type { 
  CampaignSummary, 
  CampaignWithCreator,
  Lead,
  LeadListItem,
} from '@/types';

/**
 * Authentication APIs
 */
export const authApi = {
  async login(email: string, password: string) {
    return apiClient.post('/auth/login', { email, password });
  },

  async logout() {
    return apiClient.post('/auth/logout');
  },

  async getCurrentUser() {
    return apiClient.get('/auth/me');
  },
};

/**
 * Campaign APIs
 */
export const campaignApi = {
  async getAll(limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return apiClient.get<CampaignSummary[]>(`/campaigns${query}`);
  },

  async getById(id: string) {
    return apiClient.get<CampaignWithCreator>(`/campaigns/${id}`);
  },

  async getStats(id: string) {
    return apiClient.get(`/campaigns/${id}/stats`);
  },

  async upload(name: string, file: File) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);
    return apiClient.upload('/campaigns/upload', formData);
  },

  async delete(id: string) {
    return apiClient.delete(`/campaigns/${id}`);
  },
};

/**
 * Lead APIs
 */
export const leadApi = {
  async getByCampaign(campaignId: string, params?: {
    page?: number;
    pageSize?: number;
    riskLevel?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.riskLevel) searchParams.set('riskLevel', params.riskLevel);
    
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get<LeadListItem[]>(`/campaigns/${campaignId}/leads${query}`);
  },

  async getById(id: string) {
    return apiClient.get<Lead>(`/leads/${id}`);
  },
};

/**
 * Inference API
 */
export const inferenceApi = {
  async score(data: any) {
    return apiClient.post('/inference/score', data);
  },
};