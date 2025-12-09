import { z } from "zod";

/**
 * Single inference validation schema
 * For real-time scoring via form input
 */

export const SingleInferenceSchema = z.object({
  age: z.number().int().min(18).max(100),
  job: z.string().min(1),
  marital: z.string().min(1),
  education: z.string().min(1),
  default: z.string().min(1),
  balance: z.number(),
  housing: z.string().min(1),
  loan: z.string().min(1),
  contact: z.string().min(1),
  day: z.number().int().min(1).max(31),
  month: z.string().min(1),
  campaign: z.number().int().min(1),
  pdays: z.number().int().min(-1),
  previous: z.number().int().min(0),
  poutcome: z.string().min(1),
});

export type SingleInferenceInput = z.infer<typeof SingleInferenceSchema>;
