import { z } from "zod";

/**
 * User validation schemas
 */

// User role enum
export const UserRoleSchema = z.enum(["admin", "user"]);

// Update user payload
export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores")
    .optional(),
  role: UserRoleSchema.optional(),
});

// User query params
export const UserQuerySchema = z.object({
  role: UserRoleSchema.optional(),
  limit: z.string().optional().default("50").transform(val => parseInt(val)).pipe(z.number().int().positive().max(100)),
});

// Username availability check
export const UsernameCheckSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UserQueryInput = z.infer<typeof UserQuerySchema>;
export type UsernameCheckInput = z.infer<typeof UsernameCheckSchema>;
