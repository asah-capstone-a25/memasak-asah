import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { getCurrentUser } from "@/lib/api/users";
import { getUsers, getUsersByRole } from "@/lib/api/users";
import { UserQuerySchema } from "@/lib/validation";

/**
 * GET /api/users
 * List all users (with optional role filter)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    // Check if user is admin
    if (currentUser.role !== "admin") {
      return apiError("Admin access required", 403);
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, string> = {};
    if (searchParams.get("role")) queryParams.role = searchParams.get("role")!;
    if (searchParams.get("limit")) queryParams.limit = searchParams.get("limit")!;

    // Validate query params
    const validationResult = UserQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return apiError("Invalid query parameters", 400, validationResult.error.issues);
    }

    const { role, limit } = validationResult.data;

    // Fetch users
    let users;
    if (role) {
      users = await getUsersByRole(role);
    } else {
      users = await getUsers(limit);
    }

    return apiSuccess(users);
  } catch (error) {
    return handleApiError(error);
  }
}
