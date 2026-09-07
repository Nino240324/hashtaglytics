'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollReveal() {
  // Re-runs on every route change. Without this dependency the observer is
  // created once for the whole app: navigate away and back, the elements
  // remount at opacity 0, and nothing ever reveals them again.
  const pathname = usePathname();

  useEffect(() => {
    const els = document.querySelectorAll('.row, .step');

    // Motion off: everything visible, nothing hidden. The failure mode to
    // avoid is a page that respects the preference by staying blank.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('seen'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('seen');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}