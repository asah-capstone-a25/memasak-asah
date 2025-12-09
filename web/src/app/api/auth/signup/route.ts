import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { signUp } from "@/lib/auth";
import { z } from "zod";

const SignUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores"),
  name: z.string().min(1, "Name is required").max(255),
  role: z.enum(["admin", "user"]).optional().default("user"),
});

/**
 * POST /api/auth/signup
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = SignUpSchema.safeParse(body);
    if (!validationResult.success) {
      return apiError("Invalid signup data", 400, validationResult.error.issues);
    }

    const { email, password, username, name, role } = validationResult.data;

    // Sign up user
    const result = await signUp(email, password, {
      username,
      name,
      role,
    });

    return apiSuccess(
      {
        user: result.user,
        session: result.session,
      },
      "User registered successfully",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
