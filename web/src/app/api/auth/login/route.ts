import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { signIn } from "@/lib/auth";
import { z } from "zod";

const SignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = SignInSchema.safeParse(body);
    if (!validationResult.success) {
      return apiError("Invalid login data", 400, validationResult.error.issues);
    }

    const { email, password } = validationResult.data;

    // Sign in user
    const result = await signIn(email, password);

    return apiSuccess({
      user: result.user,
      session: result.session,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
