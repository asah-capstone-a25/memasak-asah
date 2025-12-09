import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { getCurrentUser } from "@/lib/api/users";
import { createCampaign, updateCampaign } from "@/lib/api/campaigns";
import { bulkInsertLeads } from "@/lib/api/leads";
import { REQUIRED_CSV_COLUMNS } from "@/lib/validation";

// ML Service configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const ML_BULK_MAX_ROWS = parseInt(process.env.ML_BULK_MAX_ROWS || "1000");

// Disable Next.js body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * POST /api/campaigns/upload
 * Upload CSV file and trigger ML inference
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const campaignName = formData.get("name") as string | null;

    // Validate inputs
    if (!file) {
      return apiError("File is required", 400);
    }

    if (!campaignName || campaignName.trim().length === 0) {
      return apiError("Campaign name is required", 400);
    }

    // Validate file type
    const isCSV = file.type.includes("csv") || 
                  file.type.includes("excel") || 
                  file.type === "text/plain" ||
                  file.name.endsWith(".csv");
    
    if (!isCSV) {
      return apiError("File must be a CSV", 400);
    }

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return apiError("File size must be less than 10MB", 400);
    }

    // Check if file is empty
    if (file.size === 0) {
      return apiError("File is empty", 400);
    }

    // Parse CSV to validate columns
    const fileContent = await file.text();
    const lines = fileContent.trim().split("\n");
    
    if (lines.length < 2) {
      return apiError("CSV file must contain at least a header row and one data row", 400);
    }

    // Validate CSV headers
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const missingColumns = REQUIRED_CSV_COLUMNS.filter(
      (col) => !headers.includes(col)
    );

    if (missingColumns.length > 0) {
      return apiError(
        `Missing required columns: ${missingColumns.join(", ")}`,
        400,
        { missingColumns }
      );
    }

    // Count rows (excluding header)
    const dataRowCount = lines.length - 1;

    if (dataRowCount > ML_BULK_MAX_ROWS) {
      return apiError(
        `CSV contains ${dataRowCount} rows, but maximum allowed is ${ML_BULK_MAX_ROWS}`,
        400,
        { rowCount: dataRowCount, maxRows: ML_BULK_MAX_ROWS }
      );
    }

    // Create campaign record with status "processing"
    const campaign = await createCampaign({
      name: campaignName.trim(),
      source_filename: file.name,
      total_rows: dataRowCount,
      processed_rows: 0,
      dropped_rows: 0,
      avg_probability: null,
      conversion_high: 0,
      conversion_medium: 0,
      conversion_low: 0,
      status: "processing",
      created_by: currentUser.id,
    });

    // Send CSV to ML service
    try {
      const mlFormData = new FormData();
      // Recreate the file blob from content
      const blob = new Blob([fileContent], { type: "text/csv" });
      mlFormData.append("file", blob, file.name);

      const mlResponse = await fetch(`${ML_SERVICE_URL}/bulk-score`, {
        method: "POST",
        body: mlFormData,
      });

      if (!mlResponse.ok) {
        const errorData = await mlResponse.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `ML Service error: ${mlResponse.statusText}`
        );
      }

      const mlResult = await mlResponse.json();

      // Check if ML service returned success
      if (!mlResult.success) {
        throw new Error("ML inference failed");
      }

      // Prepare leads for bulk insert
      const leadsToInsert = mlResult.predictions.map((prediction: any) => ({
        campaign_run_id: campaign.id,
        row_index: prediction.row_index,
        // Extract customer features from the original CSV row
        age: parseInt(lines[prediction.row_index + 1].split(",")[headers.indexOf("age")]),
        job: lines[prediction.row_index + 1].split(",")[headers.indexOf("job")].trim(),
        marital: lines[prediction.row_index + 1].split(",")[headers.indexOf("marital")].trim(),
        education: lines[prediction.row_index + 1].split(",")[headers.indexOf("education")].trim(),
        default_credit: lines[prediction.row_index + 1].split(",")[headers.indexOf("default")].trim(),
        balance: parseFloat(lines[prediction.row_index + 1].split(",")[headers.indexOf("balance")]),
        housing: lines[prediction.row_index + 1].split(",")[headers.indexOf("housing")].trim(),
        loan: lines[prediction.row_index + 1].split(",")[headers.indexOf("loan")].trim(),
        contact: lines[prediction.row_index + 1].split(",")[headers.indexOf("contact")].trim(),
        day: parseInt(lines[prediction.row_index + 1].split(",")[headers.indexOf("day")]),
        month: lines[prediction.row_index + 1].split(",")[headers.indexOf("month")].trim(),
        campaign: parseInt(lines[prediction.row_index + 1].split(",")[headers.indexOf("campaign")]),
        pdays: parseInt(lines[prediction.row_index + 1].split(",")[headers.indexOf("pdays")]),
        previous: parseInt(lines[prediction.row_index + 1].split(",")[headers.indexOf("previous")]),
        poutcome: lines[prediction.row_index + 1].split(",")[headers.indexOf("poutcome")].trim(),
        // ML predictions
        probability: prediction.probability,
        prediction: prediction.prediction,
        prediction_label: prediction.prediction_label,
        risk_level: prediction.risk_level,
        reason_codes: prediction.reason_codes,
      }));

      // Bulk insert leads
      await bulkInsertLeads(leadsToInsert);

      // Update campaign with final statistics
      const updatedCampaign = await updateCampaign(campaign.id, {
        status: "completed",
        processed_rows: mlResult.summary.processed_rows,
        dropped_rows: mlResult.summary.dropped_rows,
        avg_probability: mlResult.summary.avg_probability,
        conversion_high: mlResult.summary.conversion_high,
        conversion_medium: mlResult.summary.conversion_medium,
        conversion_low: mlResult.summary.conversion_low,
      });

      return apiSuccess(
        {
          campaign: updatedCampaign,
          summary: mlResult.summary,
          invalid_rows: mlResult.invalid_rows,
        },
        "Campaign created and leads scored successfully",
        201
      );
    } catch (mlError) {
      // Update campaign status to failed
      await updateCampaign(campaign.id, {
        status: "failed",
        error_message:
          mlError instanceof Error ? mlError.message : "ML inference failed",
      });

      console.error("ML Service Error:", mlError);
      return apiError(
        "Failed to process CSV with ML service",
        500,
        mlError instanceof Error ? mlError.message : "Unknown error"
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}
