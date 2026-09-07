import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import ScrollReveal from '@/components/scroll-reveal';

// Everything under this group gets the public site's header/footer --
// the homepage, tarifs, the legal pages, and the (auth) pages nested
// inside it. /app/* is deliberately NOT part of this group, so it no
// longer inherits this nav at all -- that's the actual fix for the
// double-nav bug: SiteHeader/SiteFooter moved OUT of the root layout
// (which wraps everything unconditionally) and into this group
// (which only wraps what's placed inside it).
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <ScrollReveal />
    </>
  );
}
