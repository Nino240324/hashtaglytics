import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Returns a Supabase client bound to this specific request, plus a
// response object that will carry any refreshed session cookies.
//
// IMPORTANT for whoever calls this from proxy.ts: if proxy.ts's own
// logic decides to redirect (e.g. NextResponse.redirect(...)) rather
// than continue, the refreshed cookies from THIS response must be
// copied onto that redirect response, or the refresh is silently lost
// on that request -- the user's session would still work, but one
// fewer request's worth of refresh headroom than it should have had.
// Do this with: refreshedResponse.cookies.getAll().forEach(cookie =>
// redirectResponse.cookies.set(cookie)).
//
// getUser() (not getSession()) is what actually triggers the refresh
// AND validates the session against Supabase, rather than trusting
// the cookie's presence alone -- see proxy.ts for why that distinction
// matters for a forged-cookie scenario.
export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, response };
}
