"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Create Supabase client for browser/client components.
 * Use this in components with "use client" directive.
 * 
 * @example
 * ```tsx
 * "use client";
 * import { createClient } from "@/lib/supabase/client";
 * 
 * export default function MyComponent() {
 *   const supabase = createClient();
 *   // Use supabase client...
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
