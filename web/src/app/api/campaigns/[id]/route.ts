import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { getCurrentUser } from "@/lib/api/users";
import { getCampaignById, getCampaignWithCreator, deleteCampaign } from "@/lib/api/campaigns";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/campaigns/[id]
 * Get campaign details with creator information
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    const { id } = await params;

    // Fetch campaign with creator info
    const campaign = await getCampaignWithCreator(id);

    if (!campaign) {
      return apiError("Campaign not found", 404);
    }

    return apiSuccess(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/campaigns/[id]
 * Delete a campaign and all associated leads
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    const { id } = await params;

    // Check if campaign exists
    const campaign = await getCampaignById(id);
    if (!campaign) {
      return apiError("Campaign not found", 404);
    }

    // Check if user is the creator or admin
    if (campaign.created_by !== currentUser.id && currentUser.role !== "admin") {
      return apiError("You don't have permission to delete this campaign", 403);
    }

    // Delete campaign (cascades to leads)
    await deleteCampaign(id);

    return apiSuccess({ id }, "Campaign deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
