# API Routes Implementation Summary

## Completed Implementation

Backend API routes telah selesai diimplementasikan dengan 9 commits yang terorganisir.

### 📦 Dependencies
- **Zod** - Validation library untuk schema validation

### 🛡️ Validation Schemas (`web/src/lib/validation/`)
- `api.ts` - API response types (success, error, paginated)
- `campaign.ts` - Campaign validation (file upload, CSV format)
- `lead.ts` - Lead validation (pagination, filtering, sorting)
- `user.ts` - User validation (profile updates, role management)

### 🔧 Utility Functions (`web/src/lib/utils/api.ts`)
- `apiSuccess()` - Standardized success responses
- `apiError()` - Standardized error responses
- `apiPaginated()` - Paginated responses with metadata
- `handleApiError()` - Centralized error handling
- `requireAuth()` - Authentication checks
- `requireAdminRole()` - Authorization checks

### 🚀 API Endpoints

#### Campaign Management
```
POST   /api/campaigns/upload          Upload CSV & trigger ML inference
GET    /api/campaigns                 List all campaigns (with filters)
GET    /api/campaigns/[id]            Get campaign details
DELETE /api/campaigns/[id]            Delete campaign (creator/admin only)
GET    /api/campaigns/[id]/leads      Paginated & filtered leads
GET    /api/campaigns/[id]/stats      Lead statistics aggregation
```

#### Lead Management
```
GET    /api/leads/[id]                Get single lead with reason codes
```

#### User Management (Admin)
```
GET    /api/users                     List all users (admin only)
GET    /api/users/[id]                Get user details
PATCH  /api/users/[id]                Update user profile/role
```

#### System
```
GET    /api/health                    Check API & ML service status
```

## Key Features Implemented

### 1. CSV Upload & ML Integration (`/api/campaigns/upload`)
- ✅ File validation (type, size, format)
- ✅ CSV column validation (15 required columns)
- ✅ Row count limit enforcement (max 1000 rows)
- ✅ Create campaign with "processing" status
- ✅ Forward CSV to ML service (`http://localhost:8000/bulk-score`)
- ✅ Parse ML predictions and summary
- ✅ Bulk insert leads in batches (500 rows per batch)
- ✅ Update campaign status to "completed" or "failed"
- ✅ Handle ML service errors gracefully

### 2. Authentication & Authorization
- ✅ All routes require authentication via `getCurrentUser()`
- ✅ Role-based access control (admin vs user)
- ✅ Users can only delete their own campaigns
- ✅ Admins can delete any campaign
- ✅ Users can view/edit own profile
- ✅ Only admins can change user roles

### 3. Data Filtering & Pagination
- ✅ Campaign filtering by creator
- ✅ Lead filtering by:
  - Risk level (Low/Medium/High)
  - Probability range (min/max)
  - Job category
  - Education level
- ✅ Pagination with configurable page size
- ✅ Sorting by probability, age, balance, created_at
- ✅ Pagination metadata (total pages, has next/previous)

### 4. Error Handling
- ✅ Zod schema validation for all inputs
- ✅ Standardized error response format
- ✅ Proper HTTP status codes:
  - 200 - Success
  - 201 - Created
  - 400 - Bad Request (validation errors)
  - 401 - Unauthorized (not authenticated)
  - 403 - Forbidden (insufficient permissions)
  - 404 - Not Found
  - 500 - Internal Server Error
  - 503 - Service Unavailable (ML service down)

### 5. Configuration
- ✅ Next.js body size limit: 10MB
- ✅ Environment variables:
  - `ML_SERVICE_URL` - ML service endpoint
  - `ML_BULK_MAX_ROWS` - Max rows per CSV (1000)
  - Supabase credentials

## Data Flow: CSV Upload → Lead Scoring

```
1. User uploads CSV file
   ↓
2. Validate file (type, size, columns, row count)
   ↓
3. Create campaign (status: "processing")
   ↓
4. Send CSV to ML service
   POST http://localhost:8000/bulk-score
   ↓
5. ML returns predictions + summary
   {
     predictions: [...],
     summary: { processed_rows, avg_probability, ... },
     invalid_rows: [...]
   }
   ↓
6. Bulk insert leads (batches of 500)
   - Extract customer features from CSV
   - Add ML predictions (probability, risk_level, reason_codes)
   ↓
7. Update campaign (status: "completed")
   - total_rows, processed_rows, dropped_rows
   - avg_probability
   - conversion counts (high/medium/low)
   ↓
8. Return campaign + summary to client
```

## Testing Checklist

### Campaign Upload
- [ ] Upload valid CSV file (< 10MB, < 1000 rows)
- [ ] Reject invalid file type
- [ ] Reject file exceeding size limit
- [ ] Reject CSV with missing columns
- [ ] Reject CSV exceeding row limit
- [ ] Handle ML service unavailable
- [ ] Handle ML inference errors
- [ ] Verify campaign status updates
- [ ] Verify leads are inserted correctly

### Campaign Management
- [ ] List all campaigns
- [ ] Filter campaigns by creator
- [ ] Get campaign details with creator info
- [ ] Delete own campaign
- [ ] Admin can delete any campaign
- [ ] Non-creator cannot delete campaign

### Lead Queries
- [ ] Paginate leads (page, pageSize)
- [ ] Filter by risk level
- [ ] Filter by probability range
- [ ] Filter by job/education
- [ ] Sort by probability/age/balance
- [ ] Get lead statistics
- [ ] Get single lead details

### User Management
- [ ] Admin can list all users
- [ ] Admin can filter by role
- [ ] User can view own profile
- [ ] Admin can view any profile
- [ ] User can update own name/username
- [ ] Only admin can change roles
- [ ] Non-admin cannot access user list

### Health Check
- [ ] Returns API status
- [ ] Checks ML service availability
- [ ] Returns ML service details when available
- [ ] Handles ML service timeout

## Next Steps

### Frontend Integration
1. Create auth pages (login, signup)
2. Build dashboard layout with navigation
3. Implement campaign upload UI
4. Build lead list with filters
5. Create lead detail page with reason codes
6. Add admin user management UI

### Testing
1. Write integration tests for API routes
2. Test ML service integration
3. Test error scenarios
4. Performance testing with large CSV files

### Deployment
1. Setup environment variables
2. Configure ML service URL
3. Test end-to-end flow in staging
4. Deploy to production

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ML Service
ML_SERVICE_URL=http://localhost:8000
ML_BULK_MAX_ROWS=1000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Git Commits

```
9f5d317 config: configure Next.js for large file uploads
8eb447f feat: add health check API endpoint
5b97d09 feat: implement user management API routes
8ddf89e feat: implement lead detail API route
a52e873 feat: implement campaign API routes
deaa06e feat: enhance campaign API to support filtering by creator
8f804c0 feat: add API response helper functions
762b84d feat: add validation schemas for API requests
bafcc38 chore: install zod for API validation
```

## Status: ✅ COMPLETED

All backend API routes telah selesai diimplementasikan dan siap untuk digunakan oleh frontend.
