import { createClient } from "@/lib/supabase/server";
import type { Lead, LeadListItem, CreateLeadPayload, Database } from "@/types";

// Type alias for database insert type
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];

/**
 * Pagination options for lead queries.
 */
export interface LeadPaginationOptions {
  page?: number;
  pageSize?: number;
}

/**
 * Filter options for lead queries.
 */
export interface LeadFilterOptions {
  riskLevel?: "Low" | "Medium" | "High";
  minProbability?: number;
  maxProbability?: number;
  job?: string;
  education?: string;
}

/**
 * Result of paginated lead query.
 */
export interface PaginatedLeads {
  data: LeadListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get leads for a campaign, sorted by probability (highest first).
 * This is the priority list for sales team.
 * 
 * @param campaignRunId - Campaign UUID
 * @param options - Pagination options
 * @param filters - Filter options
 * @returns Paginated leads
 */
export async function getLeadsByCampaign(
  campaignRunId: string,
  options: LeadPaginationOptions = {},
  filters: LeadFilterOptions = {}
): Promise<PaginatedLeads> {
  const supabase = await createClient();
  const { page = 1, pageSize = 25 } = options;
  const offset = (page - 1) * pageSize;

  // Build query
  let query = supabase
    .from("leads")
    .select(
      "id, row_index, age, job, marital, education, balance, probability, risk_level",
      { count: "exact" }
    )
    .eq("campaign_run_id", campaignRunId);

  // Apply filters
  if (filters.riskLevel) {
    query = query.eq("risk_level", filters.riskLevel);
  }
  if (filters.minProbability !== undefined) {
    query = query.gte("probability", filters.minProbability);
  }
  if (filters.maxProbability !== undefined) {
    query = query.lte("probability", filters.maxProbability);
  }
  if (filters.job) {
    query = query.eq("job", filters.job);
  }
  if (filters.education) {
    query = query.eq("education", filters.education);
  }

  // Apply sorting and pagination
  const { data, error, count } = await query
    .order("probability", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error("Error fetching leads:", error);
    throw new Error(`Failed to fetch leads: ${error.message}`);
  }

  const total = count || 0;

  return {
    data: (data || []) as LeadListItem[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get a single lead by ID with full details.
 * 
 * @param id - Lead UUID
 * @returns Lead details or null if not found
 */
export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching lead:", error);
    throw new Error(`Failed to fetch lead: ${error.message}`);
  }

  // Cast reason_codes from Json to ReasonCode[]
  return data as unknown as Lead;
}

/**
 * Convert CreateLeadPayload to database insert format.
 * Handles ReasonCode[] to Json conversion.
 */
function toLeadInsert(lead: CreateLeadPayload): LeadInsert {
  return {
    ...lead,
    reason_codes: lead.reason_codes as unknown as LeadInsert["reason_codes"],
  };
}

/**
 * Bulk insert leads for a campaign.
 * Used after ML inference to save all predictions.
 * 
 * @param leads - Array of leads to insert
 * @returns Number of inserted rows
 */
export async function bulkInsertLeads(
  leads: CreateLeadPayload[]
): Promise<number> {
  const supabase = await createClient();

  // Supabase has a limit on rows per insert, batch if needed
  const BATCH_SIZE = 500;
  let insertedCount = 0;

  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE).map(toLeadInsert);
    
    const { error } = await supabase.from("leads").insert(batch);

    if (error) {
      console.error("Error inserting leads batch:", error);
      throw new Error(`Failed to insert leads: ${error.message}`);
    }

    insertedCount += batch.length;
  }

  return insertedCount;
}

/**
 * Delete all leads for a campaign.
 * Useful for re-running inference.
 * 
 * @param campaignRunId - Campaign UUID
 */
export async function deleteLeadsByCampaign(
  campaignRunId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("campaign_run_id", campaignRunId);

  if (error) {
    console.error("Error deleting leads:", error);
    throw new Error(`Failed to delete leads: ${error.message}`);
  }
}

/**
 * Get aggregate statistics for leads in a campaign.
 * 
 * @param campaignRunId - Campaign UUID
 * @returns Statistics object
 */
export async function getLeadStatsByCampaign(campaignRunId: string): Promise<{
  total: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  avgProbability: number | null;
}> {
  const supabase = await createClient();

  // Get counts by risk level
  const { data, error } = await supabase
    .from("leads")
    .select("risk_level, probability")
    .eq("campaign_run_id", campaignRunId);

  if (error) {
    console.error("Error fetching lead stats:", error);
    throw new Error(`Failed to fetch lead stats: ${error.message}`);
  }

  const leads = data || [];
  const total = leads.length;
  
  if (total === 0) {
    return {
      total: 0,
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0,
      avgProbability: null,
    };
  }

  const highRisk = leads.filter((l) => l.risk_level === "High").length;
  const mediumRisk = leads.filter((l) => l.risk_level === "Medium").length;
  const lowRisk = leads.filter((l) => l.risk_level === "Low").length;
  const avgProbability =
    leads.reduce((sum, l) => sum + (l.probability as number), 0) / total;

  return {
    total,
    highRisk,
    mediumRisk,
    lowRisk,
    avgProbability: Math.round(avgProbability * 10000) / 10000,
  };
}

/**
 * Get distinct values for filter dropdowns.
 * 
 * @param campaignRunId - Campaign UUID
 * @returns Object with distinct values for jobs and education levels
 */
export async function getLeadFilterOptions(campaignRunId: string): Promise<{
  jobs: string[];
  educationLevels: string[];
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("job, education")
    .eq("campaign_run_id", campaignRunId);

  if (error) {
    console.error("Error fetching filter options:", error);
    throw new Error(`Failed to fetch filter options: ${error.message}`);
  }

  const leads = data || [];
  const jobs = [...new Set(leads.map((l) => l.job))].sort();
  const educationLevels = [...new Set(leads.map((l) => l.education))].sort();

  return { jobs, educationLevels };
}
