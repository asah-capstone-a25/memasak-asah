import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { getCurrentUser } from "@/lib/api/users";
import { getLeadById } from "@/lib/api/leads";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/leads/[id]
 * Get single lead details with reason codes
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    const { id } = await params;

    // Fetch lead
    const lead = await getLeadById(id);

    if (!lead) {
      return apiError("Lead not found", 404);
    }

    return apiSuccess(lead);
  } catch (error) {
    return handleApiError(error);
  }
}
