import { z } from "zod";

/**
 * Lead validation schemas
 */

// Risk level enum
export const RiskLevelSchema = z.enum(["Low", "Medium", "High"]);

// Lead pagination params
export const LeadPaginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

// Lead filter params
export const LeadFilterSchema = z.object({
  riskLevel: RiskLevelSchema.optional(),
  minProbability: z.coerce.number().min(0).max(1).optional(),
  maxProbability: z.coerce.number().min(0).max(1).optional(),
  job: z.string().optional(),
  education: z.string().optional(),
  marital: z.string().optional(),
  contact: z.string().optional(),
});

// Combined lead query params
export const LeadQuerySchema = LeadPaginationSchema.merge(LeadFilterSchema);

// Lead sort params
export const LeadSortSchema = z.object({
  sortBy: z
    .enum(["probability", "age", "balance", "created_at"])
    .optional()
    .default("probability"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Complete lead query with pagination, filtering, and sorting
export const CompleteLeadQuerySchema = LeadQuerySchema.merge(LeadSortSchema);

export type LeadPaginationInput = z.infer<typeof LeadPaginationSchema>;
export type LeadFilterInput = z.infer<typeof LeadFilterSchema>;
export type LeadQueryInput = z.infer<typeof LeadQuerySchema>;
export type LeadSortInput = z.infer<typeof LeadSortSchema>;
export type CompleteLeadQueryInput = z.infer<typeof CompleteLeadQuerySchema>;
