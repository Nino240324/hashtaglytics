// app/app/_components/app-signout.tsx
//
// Rendered once in app/app/layout.tsx, positioned via CSS (absolute,
// top-right of .app-main) so it appears on every /app/* screen without
// needing to be added to each page individually -- the four pages
// already share this one layout, so this is the one place a global
// per-page element like this belongs.

'use client';

import { signOut } from '@/lib/auth-mock';

export function AppSignOut() {
  function handleSignOut() {
    signOut();
    window.location.href = '/connexion';
  }

  return (
    <button type="button" className="app-signout-top" onClick={handleSignOut}>
      <span aria-hidden="true">⏻</span> déconnexion
    </button>
  );
}
