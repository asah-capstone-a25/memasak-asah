import { NextResponse } from "next/server";
import type { ApiSuccess, ApiError, PaginatedResponse } from "@/lib/validation";

/**
 * Create a successful API response
 */
export function apiSuccess<T>(data: T, message?: string, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Create a paginated API response
 */
export function apiPaginated<T>(
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  },
  status = 200
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        ...pagination,
        hasNextPage: pagination.page < pagination.totalPages,
        hasPreviousPage: pagination.page > 1,
      },
    },
    { status }
  );
}

/**
 * Create an error API response
 */
export function apiError(error: string, status = 500, details?: any): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Handle common API errors
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
  console.error("API Error:", error);

  if (error instanceof Error) {
    // Database or Supabase errors
    if (error.message.includes("Failed to fetch")) {
      return apiError("Database connection error", 503, error.message);
    }

    // Generic error with message
    return apiError(error.message, 500);
  }

  // Unknown error
  return apiError("An unexpected error occurred", 500);
}

/**
 * Check if user is authenticated
 */
export function requireAuth(userId: string | null | undefined): NextResponse<ApiError> | null {
  if (!userId) {
    return apiError("Authentication required", 401);
  }
  return null;
}

/**
 * Check if user is admin
 */
export function requireAdminRole(isAdmin: boolean): NextResponse<ApiError> | null {
  if (!isAdmin) {
    return apiError("Admin access required", 403);
  }
  return null;
}
