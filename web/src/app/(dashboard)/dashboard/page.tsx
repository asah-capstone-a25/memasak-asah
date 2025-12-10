// web/src/app/(dashboard)/dashboard/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Upload, TrendingUp, Users, BarChart3, AlertCircle, Loader2, Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import { useCampaigns } from '@/lib/hooks/use-campaigns';

export default function DashboardPage() {
  const { campaigns, loading, error, refetch } = useCampaigns(10);

  // Calculate stats from campaigns
  const stats = {
    totalCampaigns: campaigns.length,
    totalLeads: campaigns.reduce((sum, c) => sum + (c.processed_rows || 0), 0),
    avgProbability: campaigns.length > 0
      ? Math.round(campaigns.reduce((sum, c) => sum + (c.avg_probability || 0), 0) / campaigns.length * 100)
      : 0,
    completedCampaigns: campaigns.filter(c => c.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your lead scoring campaigns</p>
        </div>
        <Link href="/campaigns/upload">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load campaigns</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Upload className="w-6 h-6 text-primary-600" />}
          label="Total Campaigns"
          value={loading ? '...' : stats.totalCampaigns.toString()}
          bgColor="bg-primary-50"
          loading={loading}
        />
        <StatCard
          icon={<Users className="w-6 h-6 text-blue-600" />}
          label="Total Leads"
          value={loading ? '...' : stats.totalLeads.toLocaleString()}
          bgColor="bg-blue-50"
          loading={loading}
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          label="Avg Probability"
          value={loading ? '...' : `${stats.avgProbability}%`}
          bgColor="bg-green-50"
          loading={loading}
        />
        <StatCard
          icon={<BarChart3 className="w-6 h-6 text-orange-600" />}
          label="Completed"
          value={loading ? '...' : stats.completedCampaigns.toString()}
          bgColor="bg-orange-50"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/campaigns/upload">
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Campaign
            </Button>
          </Link>
          <Link href="/inference">
            <Button variant="outline">
              Quick Score Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Campaigns
          </h2>
          {campaigns.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={refetch}
            >
              Refresh
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No campaigns yet
            </h3>
            <p className="text-gray-500 mb-4">
              Upload your first CSV to get started with lead scoring!
            </p>
            <Link href="/campaigns/upload">
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Campaign
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.slice(0, 5).map((campaign) => (
              <div 
                key={campaign.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                    <StatusBadge status={campaign.status} />
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>{campaign.processed_rows} leads</span>
                    <span>•</span>
                    <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                    {campaign.status === 'completed' && campaign.avg_probability && (
                      <>
                        <span>•</span>
                        <span className="text-primary-600 font-medium">
                          {(campaign.avg_probability * 100).toFixed(1)}% avg
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Link href={`/campaigns/${campaign.id}`}>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon, 
  label, 
  value, 
  bgColor,
  loading 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  bgColor: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          )}
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
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
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles] || styles.completed}`}>
      {status}
    </span>
  );
}