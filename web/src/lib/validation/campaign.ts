import { z } from "zod";

/**
 * Campaign validation schemas
 */

// CSV file upload validation
export const CsvFileSchema = z.object({
  name: z.string(),
  type: z.string().refine((type) => type === "text/csv" || type === "application/vnd.ms-excel", {
    message: "File must be a CSV",
  }),
  size: z.number().max(10 * 1024 * 1024, "File size must be less than 10MB"),
});

// Required CSV columns for lead scoring
export const REQUIRED_CSV_COLUMNS = [
  "age",
  "job",
  "marital",
  "education",
  "default",
  "balance",
  "housing",
  "loan",
  "contact",
  "day",
  "month",
  "campaign",
  "pdays",
  "previous",
  "poutcome",
] as const;

// Campaign creation payload
export const CreateCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(255),
  source_filename: z.string().min(1),
});

// Campaign update payload
export const UpdateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: z.enum(["processing", "completed", "failed"]).optional(),
  error_message: z.string().nullable().optional(),
});

// Campaign query params
export const CampaignQuerySchema = z.object({
  limit: z.string().optional().default("50").transform(val => parseInt(val)).pipe(z.number().int().positive().max(100)),
  createdBy: z.string().uuid().optional(),
});

export type CsvFileInput = z.infer<typeof CsvFileSchema>;
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>;
export type CampaignQueryInput = z.infer<typeof CampaignQuerySchema>;
