// web/src/app/(dashboard)/leads/[id]/page.tsx
'use client';

import { use, useEffect, useState } from 'react';
import { ArrowLeft, User, DollarSign, Phone, TrendingUp, TrendingDown, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { apiClient, getErrorMessage } from '@/lib/api/api-client';
import type { Lead } from '@/types';

export default function LeadDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get(`/leads/${id}`);
        setLead(response.data.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Error state
  if (error || !lead) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            Failed to Load Lead
          </h2>
          <p className="text-red-600 mb-4">{error || 'Lead not found'}</p>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Prepare data for SHAP chart
  const chartData = lead.reason_codes
    .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
    .map(code => ({
      feature: code.feature,
      value: Math.abs(code.shap_value),
      direction: code.direction,
    }));

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/dashboard">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-primary-500" />
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Age" value={lead.age} />
              <InfoItem label="Job" value={lead.job} />
              <InfoItem label="Marital Status" value={lead.marital} />
              <InfoItem label="Education" value={lead.education} />
            </div>
          </div>

          {/* Financial Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-primary-500" />
              Financial Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Balance" value={`$${lead.balance.toLocaleString()}`} />
              <InfoItem label="Housing Loan" value={lead.housing} />
              <InfoItem label="Personal Loan" value={lead.loan} />
              <InfoItem label="Default" value={lead.default_credit} />
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-primary-500" />
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Contact Type" value={lead.contact} />
              <InfoItem label="Last Contact Day" value={lead.day} />
              <InfoItem label="Last Contact Month" value={lead.month} />
              <InfoItem label="Campaign Contacts" value={lead.campaign} />
              <InfoItem label="Days Since Previous" value={lead.pdays === -1 ? 'Never contacted' : lead.pdays} />
              <InfoItem label="Previous Outcome" value={lead.poutcome} />
            </div>
          </div>
        </div>

        {/* Prediction Score */}
        <div className="space-y-6">
          {/* Score Card */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Conversion Probability</h3>
            <div className="text-center my-6">
              <div className="text-5xl font-bold mb-2">
                {(lead.probability * 100).toFixed(1)}%
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  lead.risk_level === 'High' ? 'bg-green-500' :
                  lead.risk_level === 'Medium' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`}>
                  {lead.risk_level} Risk
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-90">
                Predicted: <span className="font-semibold">{lead.prediction_label.toUpperCase()}</span>
              </p>
              <p className="text-xs opacity-75 mt-1">
                {lead.prediction_label === 'yes' 
                  ? 'Likely to subscribe' 
                  : 'Unlikely to subscribe'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-2">
              <Button className="w-full" size="sm">
                Contact Customer
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                Export Details
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SHAP Explanation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Why This Score? (Top {lead.reason_codes.length} Factors)
        </h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="feature" />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.direction === 'positive' ? '#22c55e' : '#ef4444'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 space-y-3">
          <div>
            <h4 className="font-semibold text-green-700 mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Positive Factors (increase probability)
            </h4>
            {lead.reason_codes
              .filter(code => code.direction === 'positive')
              .map((code, i) => (
                <p key={i} className="text-sm text-gray-700 ml-6">
                  • {code.feature}: +{code.shap_value.toFixed(3)}
                </p>
              ))}
          </div>
          <div>
            <h4 className="font-semibold text-red-700 mb-2 flex items-center">
              <TrendingDown className="w-4 h-4 mr-2" />
              Negative Factors (decrease probability)
            </h4>
            {lead.reason_codes
              .filter(code => code.direction === 'negative')
              .map((code, i) => (
                <p key={i} className="text-sm text-gray-700 ml-6">
                  • {code.feature}: {code.shap_value.toFixed(3)}
                </p>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900 capitalize">{value}</p>
    </div>
  );
}