import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { getCurrentUser, getUserById, updateUser } from "@/lib/api/users";
import { UpdateUserSchema } from "@/lib/validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/users/[id]
 * Get user details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    const { id } = await params;

    // Users can view their own profile, admins can view any profile
    if (currentUser.id !== id && currentUser.role !== "admin") {
      return apiError("You don't have permission to view this user", 403);
    }

    // Fetch user
    const user = await getUserById(id);

    if (!user) {
      return apiError("User not found", 404);
    }

    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/users/[id]
 * Update user profile or role
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    const { id } = await params;

    // Parse request body
    const body = await request.json();

    // Validate update payload
    const validationResult = UpdateUserSchema.safeParse(body);
    if (!validationResult.success) {
      return apiError("Invalid update data", 400, validationResult.error.issues);
    }

    const updates = validationResult.data;

    // Check permissions
    const isOwnProfile = currentUser.id === id;
    const isAdmin = currentUser.role === "admin";

    // Users can update their own name/username, but only admins can change roles
    if (!isOwnProfile && !isAdmin) {
      return apiError("You don't have permission to update this user", 403);
    }

    // Only admins can change roles
    if (updates.role && !isAdmin) {
      return apiError("Only admins can change user roles", 403);
    }

    // Update user
    const updatedUser = await updateUser(id, updates);

    return apiSuccess(updatedUser, "User updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
