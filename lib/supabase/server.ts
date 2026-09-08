import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// For server components and route handlers. Reads the session from
// the incoming request's cookies via Next's cookies() API.
//
// The try/catch around setAll is intentional, not a mistake: a Server
// Component can call this and read cookies fine, but writing cookies
// from a Server Component throws (Next only allows cookie writes from
// a Server Action or Route Handler). Swallowing that error here is
// safe specifically because proxy.ts's middleware is what refreshes
// the session on every request -- a Server Component that can't write
// the refreshed cookie itself still gets a valid session, since
// middleware already handled the refresh before this ever runs.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component -- ignorable, see comment above.
          }
        },
      },
    }
  );
}
