// web/src/app/(dashboard)/campaigns/[id]/page.tsx
'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Trash2, Users, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadsTable } from '@/components/leads/LeadsTable';
import Link from 'next/link';
import { apiClient, getErrorMessage } from '@/lib/api/api-client';
import type { CampaignWithCreator } from '@/types';

interface CampaignStats {
  total: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  avgProbability: number | null;
}

export default function CampaignDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params);
  const router = useRouter();
  
  const [campaign, setCampaign] = useState<CampaignWithCreator | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch campaign detail and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch campaign detail
        const campaignResponse = await apiClient.get(`/campaigns/${id}`);
        setCampaign(campaignResponse.data.data);

        // Fetch campaign stats
        const statsResponse = await apiClient.get(`/campaigns/${id}/stats`);
        setStats(statsResponse.data.data);

      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Handle delete campaign
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await apiClient.delete(`/campaigns/${id}`);
      router.push('/dashboard');
    } catch (err) {
      alert(getErrorMessage(err));
      setDeleting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Error state
  if (error || !campaign) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            Failed to Load Campaign
          </h2>
          <p className="text-red-600 mb-4">{error || 'Campaign not found'}</p>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span>{campaign.source_filename}</span>
            <span>•</span>
            <span>{new Date(campaign.created_at).toLocaleString()}</span>
            {campaign.creator && (
              <>
                <span>•</span>
                <span>Created by {campaign.creator.name}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="danger" 
            size="sm"
            onClick={handleDelete}
            loading={deleting}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="w-6 h-6 text-blue-600" />}
          label="Total Leads"
          value={campaign.processed_rows.toLocaleString()}
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          label="High Risk"
          value={stats?.highRisk.toLocaleString() || '0'}
          subtitle={`${((stats?.highRisk || 0) / (stats?.total || 1) * 100).toFixed(1)}%`}
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-yellow-600" />}
          label="Medium Risk"
          value={stats?.mediumRisk.toLocaleString() || '0'}
          subtitle={`${((stats?.mediumRisk || 0) / (stats?.total || 1) * 100).toFixed(1)}%`}
          bgColor="bg-yellow-50"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-gray-600" />}
          label="Low Risk"
          value={stats?.lowRisk.toLocaleString() || '0'}
          subtitle={`${((stats?.lowRisk || 0) / (stats?.total || 1) * 100).toFixed(1)}%`}
          bgColor="bg-gray-50"
        />
      </div>

      {/* Campaign Summary */}
      {campaign.status === 'completed' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Campaign Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <SummaryItem 
              label="Total Rows" 
              value={campaign.total_rows.toLocaleString()} 
            />
            <SummaryItem 
              label="Processed" 
              value={campaign.processed_rows.toLocaleString()} 
            />
            <SummaryItem 
              label="Dropped" 
              value={campaign.dropped_rows.toLocaleString()} 
            />
            <SummaryItem 
              label="Avg Probability" 
              value={campaign.avg_probability ? `${(campaign.avg_probability * 100).toFixed(1)}%` : 'N/A'} 
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {campaign.status === 'failed' && campaign.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-medium text-red-800">Campaign Failed</p>
            <p className="text-sm text-red-600 mt-1">{campaign.error_message}</p>
          </div>
        </div>
      )}

      {/* Leads Table */}
      {campaign.status === 'completed' && (
        <LeadsTable campaignId={id} />
      )}

      {/* Processing State */}
      {campaign.status === 'processing' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Processing Campaign
          </h3>
          <p className="text-blue-700">
            Your CSV is being processed and scored. This may take a few minutes...
          </p>
        </div>
      )}
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const styles = {
    completed: 'bg-green-100 text-green-800',
    processing: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${styles[status as keyof typeof styles] || styles.completed}`}>
      {status}
    </span>
  );
}

// Stat Card Component
function StatCard({ 
  icon, 
  label, 
  value, 
  subtitle,
  bgColor 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  subtitle?: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{label}</p>
        <div className={`${bgColor} p-2 rounded-lg`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

// Summary Item Component
function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}