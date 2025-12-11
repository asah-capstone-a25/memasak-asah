// web/src/app/api/campaigns/upload/route.ts
import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { getCurrentUser } from "@/lib/api/users";
import { createCampaign, updateCampaign } from "@/lib/api/campaigns";
import { bulkInsertLeads } from "@/lib/api/leads";
import { REQUIRED_CSV_COLUMNS } from "@/lib/validation";

// ML Service configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const ML_BULK_MAX_ROWS = parseInt(process.env.ML_BULK_MAX_ROWS || "1000");


/**
 * Detect CSV delimiter (comma or semicolon)
 */
function detectDelimiter(line: string): ',' | ';' {
  const commaCount = (line.match(/,/g) || []).length;
  const semicolonCount = (line.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

/**
 * Parse CSV line with detected delimiter and handle quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

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
    const lines = fileContent
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n");

    
    if (lines.length < 2) {
      return apiError("CSV file must contain at least a header row and one data row", 400);
    }

    // Detect delimiter from first line
    const delimiter = detectDelimiter(lines[0]);
    console.log(`Detected CSV delimiter: "${delimiter}"`);

    // Parse headers with detected delimiter
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine, delimiter)
      .map((h) => h.toLowerCase().replace(/"/g, '').trim());

    console.log("Parsed headers:", headers);

    // Validate CSV headers
    const missingColumns = REQUIRED_CSV_COLUMNS.filter(
      (col) => !headers.includes(col)
    );

    if (missingColumns.length > 0) {
      return apiError(
        `Missing required columns: ${missingColumns.join(", ")}`,
        400,
        { 
          missingColumns,
          foundColumns: headers,
          detectedDelimiter: delimiter
        }
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

    // Convert CSV to comma-delimited if needed (for ML service)
    let processedContent = fileContent;
    if (delimiter === ';') {
      console.log("Converting semicolon CSV to comma CSV for ML service...");
      const convertedLines = lines.map(line => {
        const values = parseCSVLine(line, ';');
        // Re-quote values that contain commas
        const quotedValues = values.map(val => {
          val = val.replace(/"/g, ''); // Remove existing quotes
          return val.includes(',') ? `"${val}"` : val;
        });
        return quotedValues.join(',');
      });
      processedContent = convertedLines.join('\n');
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
      const blob = new Blob([processedContent], { type: "text/csv" });
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
      const leadsToInsert = mlResult.predictions.map((prediction: any) => {
        const dataLine = lines[prediction.row_index + 1];
        const values = parseCSVLine(dataLine, delimiter);
        
        // Map values to columns
        const rowData: any = {};
        headers.forEach((header, idx) => {
          rowData[header] = values[idx]?.replace(/"/g, '').trim();
        });

        return {
          campaign_run_id: campaign.id,
          row_index: prediction.row_index,
          // Customer features
          age: parseInt(rowData.age),
          job: rowData.job,
          marital: rowData.marital,
          education: rowData.education,
          default_credit: rowData.default,
          balance: parseFloat(rowData.balance),
          housing: rowData.housing,
          loan: rowData.loan,
          contact: rowData.contact,
          day: parseInt(rowData.day),
          month: rowData.month,
          campaign: parseInt(rowData.campaign),
          pdays: parseInt(rowData.pdays),
          previous: parseInt(rowData.previous),
          poutcome: rowData.poutcome,
          // ML predictions
          probability: prediction.probability,
          prediction: prediction.prediction,
          prediction_label: prediction.prediction_label,
          risk_level: prediction.risk_level,
          reason_codes: prediction.reason_codes,
        };
      });

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