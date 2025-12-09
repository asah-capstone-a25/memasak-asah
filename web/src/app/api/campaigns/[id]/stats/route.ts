import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { getCurrentUser } from "@/lib/api/users";
import { getLeadStatsByCampaign } from "@/lib/api/leads";
import { getCampaignById } from "@/lib/api/campaigns";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/campaigns/[id]/stats
 * Get aggregated statistics for campaign leads
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

    // Fetch statistics
    const stats = await getLeadStatsByCampaign(campaignId);

    return apiSuccess(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
