// web/src/app/(dashboard)/campaigns/upload/page.tsx
'use client';

import { CampaignUploadForm } from '@/components/campaigns/CampaignUploadForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CampaignUploadPage() {
  const router = useRouter();

  const handleSuccess = (campaignId: string) => {
    // Redirect to campaign detail page
    router.push(`/campaigns/${campaignId}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href="/dashboard">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Campaign</h1>
        <p className="text-gray-600 mt-1">
          Upload a CSV file to score leads for your marketing campaign
        </p>
      </div>

      {/* Upload Form */}
      <CampaignUploadForm onSuccess={handleSuccess} />

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          CSV Requirements
        </h3>
        <div className="space-y-2 text-sm text-blue-700">
          <p><strong>Required columns:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>age, job, marital, education</li>
            <li>default, balance, housing, loan</li>
            <li>contact, day, month, campaign</li>
            <li>pdays, previous, poutcome</li>
          </ul>
          <p className="mt-3"><strong>Limits:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Maximum file size: 10MB</li>
            <li>Maximum rows: 1,000</li>
          </ul>
        </div>
      </div>
    </div>
  );
}