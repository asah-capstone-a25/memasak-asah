import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { getCurrentUser } from "@/lib/api/users";
import { getCampaigns } from "@/lib/api/campaigns";
import { CampaignQuerySchema } from "@/lib/validation";

/**
 * GET /api/campaigns
 * List all campaigns with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      ...(searchParams.get("limit") && { limit: searchParams.get("limit") }),
      ...(searchParams.get("createdBy") && { createdBy: searchParams.get("createdBy") }),
    };

    // Validate query params
    const validationResult = CampaignQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return apiError("Invalid query parameters", 400, validationResult.error.issues);
    }

    const { limit, createdBy } = validationResult.data;

    // Fetch campaigns
    const campaigns = await getCampaigns(limit, createdBy);

    return apiSuccess(campaigns);
  } catch (error) {
    return handleApiError(error);
  }
}
