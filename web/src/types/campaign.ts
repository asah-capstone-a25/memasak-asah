/**
 * Campaign Run - represents a single CSV upload/scoring session
 */
export interface CampaignRun {
  id: string;
  name: string;
  source_filename: string;

  // Row statistics
  total_rows: number;
  processed_rows: number;
  dropped_rows: number;

  // Scoring summary
  avg_probability: number | null;
  conversion_high: number;
  conversion_medium: number;
  conversion_low: number;

  // Status
  status: "processing" | "completed" | "failed";
  error_message: string | null;

  // Timestamps
  created_at: string; // ISO 8601 string
  updated_at: string;
}

/**
 * Campaign summary for dropdown/list views
 */
export interface CampaignSummary {
  id: string;
  name: string;
  source_filename: string;
  total_rows: number;
  processed_rows: number;
  avg_probability: number | null;
  status: CampaignRun["status"];
  created_at: string;
}

/**
 * Payload for creating a new campaign run
 */
export interface CreateCampaignRunPayload {
  name: string;
  source_filename: string;
  total_rows: number;
  processed_rows: number;
  dropped_rows: number;
  avg_probability: number | null;
  conversion_high: number;
  conversion_medium: number;
  conversion_low: number;
  status?: "processing" | "completed" | "failed";
  error_message?: string | null;
}
