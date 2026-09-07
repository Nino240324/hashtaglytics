// app/app/_components/use-is-mobile.ts
//
// null = not yet determined (server render, and the brief window before
// the first effect runs client-side). Consumers should treat null as
// "don't render either tree yet" -- per the mobile spec's "do not render
// both the table and the cards and hide one with CSS", the real fix
// needs a moment where neither renders, not a guess that might flash
// the wrong layout on load. Existing loading states (e.g. this page's
// own data-fetch loading flag) usually cover that gap naturally.

'use client';

import { useEffect, useState } from 'react';

export function useIsMobile(breakpoint = 900): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(mql.matches);
    function handleChange(e: MediaQueryListEvent) {
      setIsMobile(e.matches);
    }
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, [breakpoint]);

  return isMobile;
}
