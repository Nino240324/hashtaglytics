// app/app/layout.tsx

import type { ReactNode } from 'react';
import './app-shell.css';
import { AppSidebar } from './_components/app-sidebar';
import { BfcacheReload } from './_components/bfcache-reload';
import { AppSignOut } from './_components/app-signout';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <BfcacheReload />
      <AppSidebar />
      <main className="app-main">
        <AppSignOut />
        {children}
      </main>
    </div>
  );
}
