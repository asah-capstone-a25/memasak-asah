import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiPaginated, handleApiError } from "@/lib/utils/api";
import { getCurrentUser } from "@/lib/api/users";
import { getLeadsByCampaign } from "@/lib/api/leads";
import { getCampaignById } from "@/lib/api/campaigns";
import { CompleteLeadQuerySchema } from "@/lib/validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/campaigns/[id]/leads
 * Get paginated and filtered leads for a campaign
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    const { id: campaignId } = await params;

    // Check if campaign exists
    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      return apiError("Campaign not found", 404);
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, string> = {};
    
    // Only include params that are present
    const paramKeys = ['page', 'pageSize', 'riskLevel', 'minProbability', 'maxProbability', 
                       'job', 'education', 'sortBy', 'sortOrder'];
    paramKeys.forEach(key => {
      const value = searchParams.get(key);
      if (value !== null) queryParams[key] = value;
    });

    // Validate query params
    const validationResult = CompleteLeadQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return apiError("Invalid query parameters", 400, validationResult.error.issues);
    }

    const {
      page,
      pageSize,
      riskLevel,
      minProbability,
      maxProbability,
      job,
      education,
      sortBy,
      sortOrder,
    } = validationResult.data;

    // Fetch leads with pagination and filtering
    const result = await getLeadsByCampaign(
      campaignId,
      { page, pageSize },
      {
        riskLevel,
        minProbability,
        maxProbability,
        job,
        education,
      }
    );

    // Sort results if needed (basic implementation)
    let sortedLeads = result.data;
    if (sortBy && sortedLeads.length > 0) {
      sortedLeads = [...sortedLeads].sort((a, b) => {
        const aVal = a[sortBy as keyof typeof a];
        const bVal = b[sortBy as keyof typeof b];
        
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === "asc" ? comparison : -comparison;
      });
    }

    return apiPaginated(sortedLeads, {
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      totalCount: result.total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
