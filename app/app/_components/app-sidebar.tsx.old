// app/app/_components/app-sidebar.tsx
//
// Below 900px this becomes a hamburger in a slim app bar (current page
// name shown next to it) opening a drawer -- same interaction pattern
// as SiteHeader (portal to body, focus trap, Escape, scroll lock,
// close-on-navigate), but its own independent component and state.
// Not the same component as the public header, must not share its
// state -- a dashboard user has a different nav, per the mobile spec.

'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/lib/auth-mock';

const NAV_ITEMS = [
  { href: '/app/prospects', label: 'Prospects' },
  { href: '/app/campagnes', label: 'Campagnes' },
  { href: '/app/facturation', label: 'Facturation' },
  { href: '/app/parametres', label: 'Paramètres' },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeItem = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname?.startsWith(`${item.href}/`)
  );

  function closeDrawer() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleSignOut() {
    closeDrawer();
    signOut();
    window.location.href = '/connexion';
  }

  useEffect(() => {
    if (open) firstLinkRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open]);

  const drawerContent = (
    <>
      <div className={`app-drawer-backdrop${open ? ' open' : ''}`} onClick={closeDrawer} aria-hidden="true" />
      <div
        id="app-nav-drawer"
        ref={drawerRef}
        className={`app-drawer${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation de l'application"
        aria-hidden={!open}
      >
        <button
          type="button"
          className="app-drawer-close"
          aria-label="Fermer le menu"
          onClick={closeDrawer}
          tabIndex={open ? 0 : -1}
        >
          <span aria-hidden="true">{'\u2715'}</span>
        </button>

        <nav className="app-drawer-links" aria-label="Navigation de l'application">
          {NAV_ITEMS.map((item, i) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                ref={i === 0 ? firstLinkRef : undefined}
                className={active ? 'active' : undefined}
                aria-current={active ? 'page' : undefined}
                tabIndex={open ? 0 : -1}
                onClick={closeDrawer}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="app-drawer-rule" />

        <button
          type="button"
          className="app-drawer-signout"
          tabIndex={open ? 0 : -1}
          onClick={handleSignOut}
        >
          <span aria-hidden="true">⏻</span> déconnexion
        </button>
        <Link href="/" className="app-drawer-back" tabIndex={open ? 0 : -1} onClick={closeDrawer}>
          ← Retour au site
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar -- unchanged, CSS hides this below 900px */}
      <aside className="app-sidebar">
        <Link href="/" className="logo">
          <img src="/images/logo.webp" alt="Hashtaglytics" className="logo-img" />
        </Link>

        <nav className="app-nav" aria-label="Navigation de l'application">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`app-nav-link${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link href="/" className="foot-link">
          ← Retour au site
        </Link>
      </aside>

      {/* Mobile app bar -- CSS hides this at 900px+ */}
      <div className="app-topbar">
        <button
          ref={triggerRef}
          type="button"
          className="app-topbar-burger"
          aria-expanded={open}
          aria-controls="app-nav-drawer"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setOpen(true)}
        >
          <span aria-hidden="true">☰</span>
        </button>
        <span className="app-topbar-title">{activeItem?.label ?? ''}</span>
      </div>

      {mounted && createPortal(drawerContent, document.body)}
    </>
  );
}
