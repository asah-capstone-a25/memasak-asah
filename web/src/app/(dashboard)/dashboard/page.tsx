// web/src/app/(dashboard)/dashboard/page.tsx
'use client';

import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { Upload, TrendingUp, Users, BarChart3, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCampaigns } from '@/lib/hooks/use-campaigns';

export default function DashboardPage() {
  const { campaigns, loading, error } = useCampaigns(10);

  // Calculate stats from campaigns
  const stats = {
    totalCampaigns: campaigns.length,
    totalLeads: campaigns.reduce((sum, c) => sum + (c.processed_rows || 0), 0),
    avgProbability: campaigns.length > 0
      ? Math.round(campaigns.reduce((sum, c) => sum + (c.avg_probability || 0), 0) / campaigns.length * 100)
      : 0,
  };

  return (
    <>
      <Topbar 
        title="Dashboard" 
        subtitle="Overview of your lead scoring campaigns"
      />
      
      <div className="space-y-6 mt-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-medium text-red-800">Failed to load campaigns</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
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
            value={loading ? '...' : campaigns.filter(c => c.status === 'completed').length.toString()}
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
                Quick Score
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Campaigns
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No campaigns yet. Upload your first CSV to get started!</p>
              <Link href="/campaigns/upload">
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Campaign
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.slice(0, 5).map((campaign) => (
                <div 
                  key={campaign.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {campaign.processed_rows} leads • {new Date(campaign.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Avg Probability</p>
                      <p className="text-lg font-semibold text-primary-600">
                        {campaign.avg_probability ? `${(campaign.avg_probability * 100).toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                    <Link href={`/campaigns/${campaign.id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
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