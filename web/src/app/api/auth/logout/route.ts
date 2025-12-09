import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { signOut } from "@/lib/auth";

/**
 * POST /api/auth/logout
 * Sign out user and clear session
 */
export async function POST(request: NextRequest) {
  try {
    const result = await signOut();

    if (result.error) {
      return apiError(result.error.message, 500);
    }

    return apiSuccess({ success: true }, "Signed out successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
