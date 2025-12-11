// web/src/proxy.ts
import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

/**
 * Next.js 16 Proxy (previously middleware.ts)
 * 
 * This proxy runs before a request is completed and:
 * 1. Refreshes the user's session on every request
 * 2. Protects routes that require authentication
 * 3. Redirects authenticated users away from auth pages
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Configure which routes the proxy should run on.
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