# Dokumentasi Frontend Development - Lead Scoring Portal

## 📋 Overview

Portal ini adalah aplikasi web untuk scoring dan manajemen leads perbankan menggunakan Machine Learning. Backend sudah 100% selesai dan siap diintegrasikan dengan frontend.

---

## 🎯 Konsep Utama Aplikasi

### 1. **Campaign-Based Lead Management**
- **1 Campaign = 1 File CSV yang diupload**
- Setiap upload CSV akan membuat 1 campaign baru
- Campaign menyimpan metadata: nama, tanggal upload, jumlah rows, status, statistik
- Semua leads di dalam 1 CSV akan ter-link ke campaign tersebut
- Jika campaign dihapus, semua leads di dalamnya juga ikut terhapus (cascade delete)

### 2. **Bulk Inference (Campaign Upload)**
- User upload file CSV berisi data customer
- System otomatis kirim ke ML service untuk scoring
- Hasil scoring (probability, risk level, reason codes) disimpan ke database
- User bisa filter, sort, dan export leads dari campaign

### 3. **Single Inference (Form Manual)**
- User input data 1 customer via form
- System langsung scoring secara real-time
- **HASIL TIDAK DISIMPAN ke database** - hanya ditampilkan sementara
- Berguna untuk quick check atau demo scoring

### 4. **Role-Based Access**
- **User**: Upload campaign, lihat campaign sendiri, lihat leads
- **Admin**: Semua akses user + manage users + lihat semua campaign

---

## 🔗 Alur Aplikasi

### Flow 1: User Registration & Login
```
1. User buka /signup
2. Isi form (email, password, username, name)
3. Submit → POST /api/auth/signup
4. Redirect ke /login
5. Input email & password → POST /api/auth/login
6. Session cookie tersimpan
7. Redirect ke /dashboard
```

### Flow 2: Campaign Upload (Bulk Inference)
```
1. User di dashboard klik "Upload Campaign"
2. Buka form upload CSV
3. User pilih file CSV + isi nama campaign
4. Validasi file:
   - Format: .csv
   - Size: max 10MB
   - Rows: max 1000
   - Columns: 15 kolom wajib ada
5. Submit → POST /api/campaigns/upload
6. Backend proses:
   - Buat campaign record (status: "processing")
   - Forward CSV ke ML service
   - Terima predictions
   - Bulk insert leads (batch 500 rows)
   - Update campaign (status: "completed")
7. User diarahkan ke campaign detail page
8. Tampilkan:
   - Summary: total rows, avg probability, conversions
   - Statistics: risk level distribution (pie chart)
   - Tombol "View Leads" → link ke leads list
```

**Struktur Data Campaign:**
```typescript
{
  id: string;
  name: string;
  source_filename: string;
  total_rows: number;
  processed_rows: number;
  dropped_rows: number;
  avg_probability: number;
  conversion_high: number;    // risk level High
  conversion_medium: number;  // risk level Medium
  conversion_low: number;     // risk level Low
  status: "processing" | "completed" | "failed";
  created_at: string;
  created_by: string;
  creator: {
    username: string;
    name: string;
  }
}
```

### Flow 3: View & Filter Leads
```
1. User klik "View Leads" dari campaign detail
2. GET /api/campaigns/{id}/leads dengan query params:
   - page, pageSize (pagination)
   - riskLevel, minProbability, maxProbability (filter)
   - job, education (filter)
   - sortBy, sortOrder (sorting)
3. Tampilkan table dengan kolom:
   - Age, Job, Marital, Education
   - Balance
   - Probability (dengan progress bar)
   - Risk Level (badge warna)
   - Action: "View Detail"
4. User bisa:
   - Filter by risk level (Low/Medium/High)
   - Filter by probability range (slider)
   - Filter by job, education (dropdown)
   - Sort by probability, age, balance
   - Pagination (next/prev page)
```

**Struktur Data Lead:**
```typescript
{
  id: string;
  campaign_run_id: string;
  row_index: number;
  
  // Customer features
  age: number;
  job: string;
  marital: string;
  education: string;
  default_credit: string;
  balance: number;
  housing: string;
  loan: string;
  contact: string;
  day: number;
  month: string;
  campaign: number;
  pdays: number;
  previous: number;
  poutcome: string;
  
  // ML predictions
  probability: number;        // 0.0 - 1.0
  prediction: 0 | 1;
  prediction_label: "yes" | "no";
  risk_level: "Low" | "Medium" | "High";
  reason_codes: Array<{
    feature: string;
    direction: "positive" | "negative";
    shap_value: number;
  }>;
  
  created_at: string;
}
```

### Flow 4: Lead Detail & Explainability
```
1. User klik "View Detail" pada 1 lead
2. GET /api/leads/{id}
3. Tampilkan:
   - Customer Profile Card
     * Personal info (age, job, marital, education)
     * Financial info (balance, housing, loan)
     * Contact info
   - Prediction Score Card
     * Probability percentage (dengan gauge chart)
     * Risk Level (badge besar)
     * Prediction label (Yes/No akan subscribe)
   - Explainability Section (SHAP values)
     * Horizontal bar chart reason codes
     * Feature importance explanation
     * Positive factors (hijau) vs Negative factors (merah)
```

**Contoh Reason Codes Display:**
```
Why this score?

✅ Positive Factors (increase probability):
  contact (cellular)     +0.264 ████████████
  day (15)              +0.178 ████████

❌ Negative Factors (decrease probability):
  housing (yes)         -0.226 █████████
  month (may)           -0.309 ███████████
  pdays (-1)            -0.450 ██████████████
```

### Flow 5: Single Inference (Form Manual)
```
1. User klik "Quick Score" atau "Single Inference"
2. Tampilkan form dengan 15 fields:
   - age (number input)
   - job (dropdown/select)
   - marital (dropdown: married/single/divorced)
   - education (dropdown: primary/secondary/tertiary/unknown)
   - default (yes/no)
   - balance (number input)
   - housing (yes/no)
   - loan (yes/no)
   - contact (dropdown: cellular/telephone/unknown)
   - day (number 1-31)
   - month (dropdown: jan-dec)
   - campaign (number input)
   - pdays (number, default -1)
   - previous (number)
   - poutcome (dropdown: success/failure/other/unknown)
3. User isi semua field
4. Submit → POST /api/inference/score
5. **Hasil TIDAK disimpan** ke database
6. Tampilkan hasil di modal atau inline:
   - Probability score
   - Risk level
   - Top 5 reason codes
   - Tombol "Reset Form" untuk scoring lagi
```

**Response Single Inference:**
```typescript
{
  success: true,
  data: {
    input: { /* customer data */ },
    prediction: {
      probability: 0.1057,
      prediction: 0,
      prediction_label: "no",
      risk_level: "Low",
      reason_codes: [
        { feature: "contact", direction: "positive", shap_value: 0.264 },
        { feature: "housing", direction: "negative", shap_value: -0.226 }
      ]
    }
  }
}
```

### Flow 6: Campaign Management
```
1. Dashboard menampilkan:
   - List campaigns (table/card)
   - Filter by status, creator (admin only)
   - Search by name
2. Setiap campaign card/row:
   - Name, upload date, total rows
   - Status badge (processing/completed/failed)
   - Average probability
   - Conversion summary (High: X, Medium: Y, Low: Z)
   - Actions:
     * View Detail
     * View Leads
     * Delete (jika creator atau admin)
3. Delete campaign:
   - Konfirmasi modal: "Delete campaign dan semua leads?"
   - DELETE /api/campaigns/{id}
   - Campaign + semua leads terhapus
```

### Flow 7: User Management (Admin Only)
```
1. Admin akses /dashboard/admin/users
2. GET /api/users
3. Tampilkan table users:
   - Username, Name, Email, Role
   - Created date
   - Jumlah campaigns created
4. Admin bisa:
   - View user detail
   - Change user role (user ↔ admin)
   - PATCH /api/users/{id} dengan { role: "admin" }
```

---

## 📡 API Endpoints Reference

### Authentication
```
POST /api/auth/signup
Body: { email, password, username, name, role? }
Response: { user, session }

POST /api/auth/login
Body: { email, password }
Response: { user, session }
Cookie: Session token otomatis tersimpan

POST /api/auth/logout
Response: { success: true }

GET /api/auth/me
Response: { user } // current user profile
```

### Campaigns
```
GET /api/campaigns?limit=50&createdBy={userId}
Response: { success: true, data: Campaign[] }

POST /api/campaigns/upload
Body: FormData { file: File, name: string }
Response: { 
  success: true, 
  data: { 
    campaign: Campaign, 
    summary: {...},
    invalid_rows: [...]
  }
}

GET /api/campaigns/{id}
Response: { success: true, data: CampaignWithCreator }

DELETE /api/campaigns/{id}
Response: { success: true, data: { id } }
Auth: Creator atau admin only
```

### Leads
```
GET /api/campaigns/{id}/leads?page=1&pageSize=20&riskLevel=High&sortBy=probability&sortOrder=desc
Response: {
  success: true,
  data: Lead[],
  pagination: {
    page, pageSize, totalPages, totalCount,
    hasNextPage, hasPreviousPage
  }
}

GET /api/campaigns/{id}/stats
Response: {
  success: true,
  data: {
    total: number,
    highRisk: number,
    mediumRisk: number,
    lowRisk: number,
    avgProbability: number
  }
}

GET /api/leads/{id}
Response: { success: true, data: Lead }
```

### Single Inference
```
POST /api/inference/score
Body: {
  age, job, marital, education, default,
  balance, housing, loan, contact, day,
  month, campaign, pdays, previous, poutcome
}
Response: {
  success: true,
  data: {
    input: {...},
    prediction: {
      probability, prediction, prediction_label,
      risk_level, reason_codes
    }
  }
}
Note: TIDAK disimpan ke database
```

### Users (Admin)
```
GET /api/users?role=admin&limit=50
Response: { success: true, data: User[] }
Auth: Admin only

GET /api/users/{id}
Response: { success: true, data: User }
Auth: Own profile atau admin

PATCH /api/users/{id}
Body: { name?, username?, role? }
Response: { success: true, data: User }
Auth: Own profile (tidak bisa ubah role) atau admin
```

### Health Check
```
GET /api/health
Response: {
  success: true,
  data: {
    api: "ok",
    ml_service: "ok",
    ml_details: { model_loaded: true, ... }
  }
}
```

---

## 🎨 Rekomendasi Tech Stack Frontend

### UI Framework & Libraries
```bash
# UI Component Library (pilih salah satu)
npx shadcn-ui@latest init        # Recommended - Tailwind based
npm install @mui/material         # Alternatif - Material UI

# Data Fetching & State Management
npm install @tanstack/react-query  # Recommended untuk API calls
npm install axios                  # HTTP client

# Form Management
npm install react-hook-form       # Form handling
npm install zod                   # Validation (sudah ada di backend)
npm install @hookform/resolvers   # Zod integration

# Charts & Visualization
npm install recharts              # Charts library
npm install react-gauge-chart     # Gauge untuk probability score

# File Upload
npm install react-dropzone        # Drag & drop CSV upload

# Table
npm install @tanstack/react-table # Powerful table dengan sorting/filtering

# Toast Notifications
npm install sonner                # Toast notifications (jika pakai shadcn)
```

### Folder Structure Rekomendasi
```
web/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Protected layout dengan nav
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Dashboard home
│   │   ├── campaigns/
│   │   │   ├── page.tsx            # Campaign list
│   │   │   ├── new/page.tsx        # Upload campaign
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Campaign detail
│   │   │       └── leads/page.tsx  # Leads list
│   │   ├── leads/
│   │   │   └── [id]/page.tsx       # Lead detail
│   │   ├── inference/
│   │   │   └── page.tsx            # Single inference form
│   │   └── admin/
│   │       └── users/page.tsx      # User management (admin)
│   └── api/                        # Sudah ada semua
├── components/
│   ├── ui/                         # shadcn components
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── signup-form.tsx
│   ├── campaigns/
│   │   ├── campaign-card.tsx
│   │   ├── campaign-upload.tsx
│   │   └── campaign-stats.tsx
│   ├── leads/
│   │   ├── lead-table.tsx
│   │   ├── lead-filters.tsx
│   │   └── lead-detail-card.tsx
│   ├── inference/
│   │   ├── inference-form.tsx
│   │   └── prediction-result.tsx
│   ├── charts/
│   │   ├── risk-distribution-chart.tsx
│   │   ├── probability-gauge.tsx
│   │   └── reason-codes-chart.tsx
│   └── layout/
│       ├── navbar.tsx
│       ├── sidebar.tsx
│       └── user-menu.tsx
├── lib/
│   ├── api-client.ts              # Axios wrapper dengan auth
│   ├── hooks/
│   │   ├── use-auth.ts            # Auth hooks
│   │   ├── use-campaigns.ts       # Campaign queries
│   │   └── use-leads.ts           # Lead queries
│   └── utils/
│       ├── format.ts              # Format probability, date, etc
│       └── constants.ts           # Dropdown options (jobs, etc)
└── types/                          # Sudah ada dari backend
```

---

## 🔐 Authentication Flow di Frontend

### Setup Axios dengan Credentials
```typescript
// lib/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  withCredentials: true, // Penting! Untuk kirim cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor untuk handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect ke login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Protected Routes
```typescript
// middleware.ts (Next.js)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Cek cookie session
  const session = request.cookies.get('sb-access-token');
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/signup');
  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard');

  if (!session && isProtectedPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
```

---

## 📊 Contoh Component Implementation

### Campaign Upload Component
```typescript
// components/campaigns/campaign-upload.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import apiClient from '@/lib/api-client';

const uploadSchema = z.object({
  name: z.string().min(1, 'Campaign name required'),
  file: z.instanceof(File).refine((f) => f.name.endsWith('.csv'), {
    message: 'File must be CSV',
  }),
});

export function CampaignUpload() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(uploadSchema),
  });

  const onSubmit = async (data: any) => {
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', data.file[0]);
    formData.append('name', data.name);

    try {
      const response = await apiClient.post('/api/campaigns/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const campaignId = response.data.data.campaign.id;
      router.push(`/dashboard/campaigns/${campaignId}`);
    } catch (error) {
      console.error('Upload failed:', error);
      // Show error toast
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Campaign Name" />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input type="file" {...register('file')} accept=".csv" />
      {errors.file && <span>{errors.file.message}</span>}
      
      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Campaign'}
      </button>
    </form>
  );
}
```

### Lead Table dengan Filtering
```typescript
// components/leads/lead-table.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function LeadTable({ campaignId }: { campaignId: string }) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    riskLevel: '',
    minProbability: 0,
    maxProbability: 1,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['leads', campaignId, page, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        ...(filters.riskLevel && { riskLevel: filters.riskLevel }),
        minProbability: filters.minProbability.toString(),
        maxProbability: filters.maxProbability.toString(),
      });
      
      const response = await apiClient.get(
        `/api/campaigns/${campaignId}/leads?${params}`
      );
      return response.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {/* Filters */}
      <div>
        <select 
          value={filters.riskLevel} 
          onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
        >
          <option value="">All Risk Levels</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>Age</th>
            <th>Job</th>
            <th>Education</th>
            <th>Balance</th>
            <th>Probability</th>
            <th>Risk Level</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.data.map((lead: any) => (
            <tr key={lead.id}>
              <td>{lead.age}</td>
              <td>{lead.job}</td>
              <td>{lead.education}</td>
              <td>${lead.balance}</td>
              <td>{(lead.probability * 100).toFixed(2)}%</td>
              <td>
                <span className={`badge ${lead.risk_level.toLowerCase()}`}>
                  {lead.risk_level}
                </span>
              </td>
              <td>
                <a href={`/dashboard/leads/${lead.id}`}>View Detail</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div>
        <button 
          onClick={() => setPage(p => p - 1)} 
          disabled={!data.pagination.hasPreviousPage}
        >
          Previous
        </button>
        <span>Page {data.pagination.page} of {data.pagination.totalPages}</span>
        <button 
          onClick={() => setPage(p => p + 1)} 
          disabled={!data.pagination.hasNextPage}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

---

## 📝 CSV Format Requirements

User perlu upload CSV dengan format ini:

### Required Columns (15)
```csv
age,job,marital,education,default,balance,housing,loan,contact,day,month,campaign,pdays,previous,poutcome
58,management,married,tertiary,no,2143,yes,no,unknown,5,may,1,-1,0,unknown
44,technician,single,secondary,no,29,yes,no,unknown,5,may,1,-1,0,unknown
```

### Field Descriptions
- **age**: Umur customer (18-100)
- **job**: Pekerjaan (management, technician, entrepreneur, blue-collar, unknown, dll)
- **marital**: Status pernikahan (married, single, divorced)
- **education**: Pendidikan (primary, secondary, tertiary, unknown)
- **default**: Credit default (yes, no)
- **balance**: Saldo rekening (angka, bisa negatif)
- **housing**: Punya housing loan? (yes, no)
- **loan**: Punya personal loan? (yes, no)
- **contact**: Tipe kontak (cellular, telephone, unknown)
- **day**: Tanggal kontak terakhir (1-31)
- **month**: Bulan kontak terakhir (jan-dec)
- **campaign**: Jumlah kontak di campaign ini (integer)
- **pdays**: Hari sejak kontak terakhir (-1 jika belum pernah)
- **previous**: Jumlah kontak sebelum campaign ini (integer)
- **poutcome**: Hasil campaign sebelumnya (success, failure, other, unknown)

### Validations
- Max 1000 rows per file
- Max file size: 10MB
- All 15 columns harus ada
- Format: CSV dengan comma separator

**Buat template CSV download** untuk user agar mereka bisa isi data dengan benar.

---

## 🎯 Priority Implementation Order

### Week 1: Authentication & Layout
1. Setup shadcn/ui + Tailwind
2. Login page + form
3. Signup page + form
4. Protected dashboard layout (navbar, sidebar)
5. Auth context/hooks
6. Logout functionality

### Week 2: Campaign Management
7. Dashboard home (campaign list overview)
8. Campaign upload page (form + drag drop)
9. Campaign detail page (summary + stats)
10. Campaign delete functionality
11. Loading states & error handling

### Week 3: Lead Management
12. Leads table dengan pagination
13. Lead filters (risk level, probability, job, education)
14. Lead sorting
15. Lead detail page
16. Reason codes visualization (bar chart)
17. Probability gauge chart

### Week 4: Single Inference & Polish
18. Single inference form (15 fields)
19. Prediction result display
20. Risk distribution chart (campaign stats)
21. Admin user management page
22. Responsive design
23. Toast notifications
24. Empty states
25. Loading skeletons

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
cd web
npm install
```

### 2. Setup Environment
Sudah ada di `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
ML_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development
```bash
npm run dev
# Buka http://localhost:3000
```

### 4. Test API Endpoints
Gunakan test user yang sudah dibuat:
```
Admin:
- Email: admin@gmail.com
- Password: Admin123456!

User:
- Email: testuser@gmail.com  
- Password: Test123456!
```

---

## 📞 Support

Jika ada pertanyaan tentang API atau backend:
1. Cek dokumentasi ini
2. Lihat file di `web/src/app/api/` untuk implementasi detail
3. Test endpoint dengan curl atau Postman
4. Cek types di `web/src/types/` untuk struktur data

Backend sudah 100% selesai dan fully tested. Silakan mulai frontend development! 🚀
