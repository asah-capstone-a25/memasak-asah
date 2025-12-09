import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

/**
 * Next.js Middleware for Supabase Auth session management.
 * 
 * This middleware:
 * 1. Refreshes the user's session on every request
 * 2. Protects routes that require authentication
 * 3. Redirects authenticated users away from auth pages
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Configure which routes the middleware should run on.
 * 
 * Excludes:
 * - _next/static (static files)
 * - _next/image (image optimization files)
 * - favicon.ico (favicon file)
 * - Public assets (images, etc.)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
