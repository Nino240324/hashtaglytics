// proxy.ts
//
// Implements the redirect rules exactly as specified:
//   signed out + any /app/*   -> /connexion, preserving the intended
//                                destination via ?next=
//   signed in  + /connexion   -> /app/prospects
//   signed in  + /inscription -> /app/prospects
//   unverified + /app/*       -> /verifier
//
// STUB: checks a mock cookie (see lib/auth-mock.ts), not a real Supabase
// session. Swap the isSignedIn/isVerified checks for real session
// validation (e.g. @supabase/ssr's getUser(), called against the request
// cookies) when auth is wired up for real -- the redirect logic itself
// doesn't need to change, only what it reads to decide.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Read alongside pathname per Opus -- unused for now, since the
  // single-domain decision means nothing branches on it today. void
  // discards it explicitly rather than declaring an unused variable;
  // present so the structure already exists if a host-based routing
  // decision is ever reconsidered later, rather than needing to be
  // added in then.
  void request.nextUrl.hostname;
  const isSignedIn = request.cookies.get('mock_session')?.value === '1';
  const isVerified = request.cookies.get('mock_verified')?.value === '1';

  const isAppRoute = pathname.startsWith('/app');
  const isSignedInOnlyRedirect = pathname === '/connexion' || pathname === '/inscription';

  if (isAppRoute && !isSignedIn) {
    const url = request.nextUrl.clone();
    url.pathname = '/connexion';
    // Clear whatever search string was on the original request first --
    // .set() alone would only add/replace 'next', leaving any OTHER
    // stray params from the original URL attached too.
    url.search = '';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isAppRoute && isSignedIn && !isVerified) {
    const url = request.nextUrl.clone();
    url.pathname = '/verifier';
    // clone() copies the full URL, query string included -- clearing it
    // explicitly, not just changing pathname and hoping nothing was
    // attached to the original request.
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (isSignedInOnlyRedirect && isSignedIn) {
    const url = request.nextUrl.clone();
    url.pathname = '/app/prospects';
    // Same fix -- this is the exact bug that produced
    // /app/prospects?next=%2Fapp%2Fprospects: visiting /connexion?next=...
    // while already signed in cloned that query string forward into a
    // redirect where it no longer meant anything.
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// /mot-de-passe-oublie and /reinitialiser are deliberately NOT in this
// matcher -- the brief's redirect rules don't gate them on session state
// either way (someone may reasonably want to reset a password while a
// stale session cookie exists on the current device), and adding a rule
// for them wasn't asked for.
export const config = {
  matcher: ['/app/:path*', '/connexion', '/inscription'],
};
