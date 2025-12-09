import { createClient } from "@/lib/supabase/server";
import type {
  CampaignRun,
  CampaignSummary,
  CampaignWithCreator,
  CreateCampaignRunPayload,
} from "@/types";

/**
 * Get all campaigns ordered by creation date (newest first).
 * 
 * @param limit - Maximum number of campaigns to return (default: 50)
 * @param createdBy - Optional filter by user ID
 * @returns Array of campaign summaries
 */
export async function getCampaigns(limit = 50, createdBy?: string): Promise<CampaignSummary[]> {
  const supabase = await createClient();

  let query = supabase
    .from("campaign_runs")
    .select(
      "id, name, source_filename, total_rows, processed_rows, avg_probability, status, created_by, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (createdBy) {
    query = query.eq("created_by", createdBy);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching campaigns:", error);
    throw new Error(`Failed to fetch campaigns: ${error.message}`);
  }

  return (data || []) as CampaignSummary[];
}

/**
 * Get a single campaign by ID with full details.
 * 
 * @param id - Campaign UUID
 * @returns Campaign details or null if not found
 */
export async function getCampaignById(id: string): Promise<CampaignRun | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaign_runs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null;
    }
    console.error("Error fetching campaign:", error);
    throw new Error(`Failed to fetch campaign: ${error.message}`);
  }

  return data as CampaignRun;
}

/**
 * Get a campaign with creator information (joined query).
 * 
 * @param id - Campaign UUID
 * @returns Campaign with creator info or null if not found
 */
export async function getCampaignWithCreator(
  id: string
): Promise<CampaignWithCreator | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaign_runs")
    .select(
      `
      *,
      creator:users!campaign_runs_created_by_fkey (
        id,
        username,
        name,
        role
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching campaign with creator:", error);
    throw new Error(`Failed to fetch campaign: ${error.message}`);
  }

  return data as unknown as CampaignWithCreator;
}

/**
 * Create a new campaign run.
 * 
 * @param payload - Campaign data to insert
 * @returns The created campaign
 */
export async function createCampaign(
  payload: CreateCampaignRunPayload
): Promise<CampaignRun> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaign_runs")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Error creating campaign:", error);
    throw new Error(`Failed to create campaign: ${error.message}`);
  }

  return data as CampaignRun;
}

/**
 * Update a campaign run.
 * 
 * @param id - Campaign UUID
 * @param updates - Fields to update
 * @returns The updated campaign
 */
export async function updateCampaign(
  id: string,
  updates: Partial<CreateCampaignRunPayload>
): Promise<CampaignRun> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaign_runs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating campaign:", error);
    throw new Error(`Failed to update campaign: ${error.message}`);
  }

  return data as CampaignRun;
}

/**
 * Delete a campaign run (and all associated leads via CASCADE).
 * 
 * @param id - Campaign UUID
 */
export async function deleteCampaign(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("campaign_runs")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting campaign:", error);
    throw new Error(`Failed to delete campaign: ${error.message}`);
  }
}

/**
 * Get campaigns created by a specific user.
 * 
 * @param userId - User UUID
 * @param limit - Maximum number of campaigns to return
 * @returns Array of campaign summaries
 */
export async function getCampaignsByUser(
  userId: string,
  limit = 50
): Promise<CampaignSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaign_runs")
    .select(
      "id, name, source_filename, total_rows, processed_rows, avg_probability, status, created_by, created_at"
    )
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching user campaigns:", error);
    throw new Error(`Failed to fetch campaigns: ${error.message}`);
  }

  return (data || []) as CampaignSummary[];
}
