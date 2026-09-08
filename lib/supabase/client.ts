import { createBrowserClient } from '@supabase/ssr';

// For client components ('use client'). Anon key only -- this bundle
// ships to the browser, so anything more privileged here would be
// visible to every visitor. RLS is what actually restricts what this
// client can read or write, not this file.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
