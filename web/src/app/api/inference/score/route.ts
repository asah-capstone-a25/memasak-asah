import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { getCurrentUser } from "@/lib/api/users";
import { SingleInferenceSchema } from "@/lib/validation";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * POST /api/inference/score
 * Get real-time prediction for single lead via form input
 * Does not save to database - returns prediction only
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = SingleInferenceSchema.safeParse(body);
    if (!validationResult.success) {
      return apiError("Invalid input data", 400, validationResult.error.issues);
    }

    const leadData = validationResult.data;

    // Send to ML service for scoring
    try {
      const mlResponse = await fetch(`${ML_SERVICE_URL}/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leadData),
      });

      if (!mlResponse.ok) {
        const errorData = await mlResponse.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `ML Service error: ${mlResponse.statusText}`
        );
      }

      const prediction = await mlResponse.json();

      // Return prediction without saving to database
      return apiSuccess({
        input: leadData,
        prediction: {
          probability: prediction.probability,
          prediction: prediction.prediction,
          prediction_label: prediction.prediction_label,
          risk_level: prediction.risk_level,
          reason_codes: prediction.reason_codes,
        },
      });
    } catch (mlError) {
      console.error("ML Service Error:", mlError);
      return apiError(
        "Failed to get prediction from ML service",
        500,
        mlError instanceof Error ? mlError.message : "Unknown error"
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}
