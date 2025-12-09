// web/src/app/page.tsx
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">
          Lead Scoring Portal
        </h1>
        <p className="text-gray-600">
          Accenture Bank Marketing Campaign
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
          <Button variant="outline">Learn More</Button>
        </div>
      </div>
    </div>
  );
}