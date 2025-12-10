// web/src/app/(dashboard)/dashboard/page.tsx
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Target, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { campaignApi } from '@/lib/api/frontend';

/**
 * Fetch dashboard statistics from API
 */
async function getDashboardStats() {
  try {
    // Fetch recent campaigns
    const campaignsResponse = await campaignApi.getAll(10);
    const campaigns = campaignsResponse.data;

    // Calculate aggregate stats
    const totalLeads = campaigns.reduce((sum, c) => sum + c.total_rows, 0);
    const processedLeads = campaigns.reduce((sum, c) => sum + c.processed_rows, 0);
    const avgProbability = campaigns
      .filter(c => c.avg_probability !== null)
      .reduce((sum, c) => sum + (c.avg_probability || 0), 0) / 
      (campaigns.filter(c => c.avg_probability !== null).length || 1);

    const activeCampaigns = campaigns.filter(c => c.status === 'completed').length;
    const highPriorityLeads = Math.round(totalLeads * 0.3); // Estimate

    return {
      totalLeads,
      processedLeads,
      highPriorityLeads,
      avgProbability: Math.round(avgProbability * 100),
      activeCampaigns,
      recentCampaigns: campaigns.slice(0, 5),
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    // Return default values on error
    return {
      totalLeads: 0,
      processedLeads: 0,
      highPriorityLeads: 0,
      avgProbability: 0,
      activeCampaigns: 0,
      recentCampaigns: [],
    };
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads.toLocaleString(),
      icon: Users,
      color: 'primary',
      change: `${stats.processedLeads} processed`,
    },
    {
      title: 'High Priority',
      value: stats.highPriorityLeads.toLocaleString(),
      icon: Target,
      color: 'success',
      change: 'Top 30%',
    },
    {
      title: 'Avg Probability',
      value: `${stats.avgProbability}%`,
      icon: TrendingUp,
      color: 'warning',
      change: 'Across campaigns',
    },
    {
      title: 'Campaigns',
      value: stats.activeCampaigns.toString(),
      icon: BarChart3,
      color: 'secondary',
      change: 'Completed',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here&apos;s your overview.</p>
        </div>
        <Link href="/inference">
          <Button>New Prediction</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2">{stat.change}</p>
                </div>
                <div className={`p-3 bg-${stat.color}-100 rounded-lg`}>
                  <Icon className={`text-${stat.color}-600`} size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Campaigns */}
      <Card 
        title="Recent Campaigns"
        footer={
          <Link href="/campaigns">
            <Button variant="outline" size="sm" className="w-full">
              View All Campaigns <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        }
      >
        {stats.recentCampaigns.length > 0 ? (
          <div className="space-y-3">
            {stats.recentCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                  <p className="text-xs text-gray-500">
                    {campaign.processed_rows} / {campaign.total_rows} leads processed
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {campaign.avg_probability && (
                    <Badge variant="default">
                      {Math.round(campaign.avg_probability * 100)}% avg
                    </Badge>
                  )}
                  <Badge
                    variant={
                      campaign.status === 'completed'
                        ? 'success'
                        : campaign.status === 'processing'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {campaign.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No campaigns yet. Upload a CSV to get started!</p>
            <Link href="/campaigns/upload">
              <Button variant="outline" size="sm" className="mt-4">
                Upload Campaign
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}