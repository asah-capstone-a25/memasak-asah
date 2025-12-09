import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * GET /api/health
 * Check health status of the API and ML service
 */
export async function GET(request: NextRequest) {
  try {
    // Check ML service health
    const mlHealthResponse = await fetch(`${ML_SERVICE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!mlHealthResponse.ok) {
      return apiSuccess(
        {
          api: "ok",
          ml_service: "unavailable",
          ml_error: `ML service returned ${mlHealthResponse.status}`,
        },
        "API is running but ML service is unavailable"
      );
    }

    const mlHealth = await mlHealthResponse.json();

    return apiSuccess({
      api: "ok",
      ml_service: "ok",
      ml_details: mlHealth,
    });
  } catch (error) {
    // ML service unreachable
    return apiSuccess(
      {
        api: "ok",
        ml_service: "unreachable",
        ml_error: error instanceof Error ? error.message : "Unknown error",
      },
      "API is running but ML service is unreachable"
    );
  }
}
