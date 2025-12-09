import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { getCurrentUserWithProfile } from "@/lib/auth";

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserWithProfile();

    if (!user) {
      return apiError("Not authenticated", 401);
    }

    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}
