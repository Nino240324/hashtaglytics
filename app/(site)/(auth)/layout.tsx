// app/(auth)/layout.tsx
//
// Route group -- doesn't affect the URL (still resolves to /connexion,
// /inscription, etc.), just lets these five pages share this layout and
// stylesheet. Still nests inside the root app/layout.tsx, so SiteHeader/
// SiteFooter apply here the same as any other page; this only adds the
// centered-card wrapper around the actual form content.
//
// auth.css is its own file, not an addition to globals.css -- this
// project's globals.css has never been fully seen in this session, and
// isolating these five pages' styles avoids any risk of colliding with
// rules already in there.

import type { ReactNode } from 'react';
import './auth.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <div className="auth-card">{children}</div>
    </div>
  );
}
