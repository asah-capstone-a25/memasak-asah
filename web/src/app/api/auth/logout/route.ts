import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/utils/api";
import { signOut } from "@/lib/auth";

/**
 * POST /api/auth/logout
 * Sign out user and clear session
 */
export async function POST(request: NextRequest) {
  try {
    await signOut();

    return apiSuccess({ success: true }, "Signed out successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
