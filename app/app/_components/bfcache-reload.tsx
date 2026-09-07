// app/app/_components/bfcache-reload.tsx
//
// Root cause fix, not a prospects-page fix: TWO separate caches can
// restore this page with HTML/state captured at an earlier moment --
// after data loaded, with filters applied, with a row expanded -- while
// React (re)renders against fresh initial state. Nothing reconciles that
// automatically, on any current or future /app/* screen:
//
//   1. The BROWSER's own back/forward cache (bfcache) -- a real
//      document-level freeze/restore. Signalled by `pageshow` with
//      `event.persisted === true`.
//   2. Next.js's OWN internal client-side router/component cache --
//      confirmed by the Next.js team as deliberately mirroring bfcache
//      behavior for in-app back/forward navigation specifically (Vercel/
//      next.js discussion #54075). This one never touches the browser's
//      bfcache at all -- it's pure JS-level reuse of a previously
//      rendered component tree -- so `pageshow` never fires for it. What
//      DOES fire is `popstate`: it fires for any back/forward HISTORY
//      navigation (mouse back button included, since that's the same
//      browser mechanism as the on-screen button), and -- unlike
//      `pageshow` -- never fires for ordinary forward Link navigation,
//      so it doesn't over-trigger.
//
// Both are handled here, in the shared /app layout, so every screen is
// covered without each one guarding against it individually.
//
// Trade-off accepted deliberately: this forfeits both caches' instant
// back/forward navigation within /app. For a dashboard showing live
// quota/lead/campaign numbers, a stale snapshot is worse than a brief
// reload. A marketing page would decide differently -- this is scoped to
// the /app layout specifically, not the public site.

'use client';

import { useEffect } from 'react';

export function BfcacheReload() {
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    // No event.persisted equivalent on 'popstate' -- it fires only for
    // back/forward history navigation in the first place, so no
    // additional guard is needed before reloading.
    const onPopState = () => {
      window.location.reload();
    };
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  return null;
}
