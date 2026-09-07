import './globals.css';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';

const instrumentSans = localFont({
  src: './fonts/instrument-sans.woff2',
  weight: '400 500 600 700',
  display: 'swap',
  variable: '--font-instrument',
});

const ibmPlexMono400 = localFont({
  src: './fonts/ibm-plex-mono-400.woff2',
  weight: '400',
  display: 'swap',
  variable: '--font-plex-400',
});

const ibmPlexMono500 = localFont({
  src: './fonts/ibm-plex-mono-500.woff2',
  weight: '500',
  display: 'swap',
  variable: '--font-plex-500',
});

const ibmPlexMono600 = localFont({
  src: './fonts/ibm-plex-mono-600.woff2',
  weight: '600',
  display: 'swap',
  variable: '--font-plex-600',
});

export const metadata: Metadata = {
  // Required for relative paths below (e.g. the OG image) to resolve
  // to a full, absolute URL -- without this, a platform fetching the
  // link (LinkedIn, Slack, etc.) has no domain to resolve
  // /images/og-image.png against, and the preview image simply
  // wouldn't load.
  metadataBase: new URL('https://hashtaglytics.com'),
  title: 'Hashtaglytics — Des prospects SEO local qualifiés, en France',
  description:
    'Nous scannons Google Maps commune par commune, qualifions chaque entreprise sur six signaux mesurés, et livrons un diagnostic prêt à envoyer — à votre nom.',
  // Files expected at these exact paths under /public -- Next.js reads
  // this list to generate the <link> tags itself, rather than writing
  // them by hand in an index.html that this project (App Router) never
  // actually loads. These need to be Hashtaglytics' own brand assets,
  // not reused from a different project/business.
  icons: {
    icon: [
      { url: '/images/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/images/apple-touch-icon.png',
  },
  manifest: '/images/site.webmanifest',
  // Controls the preview card shown when this link is shared on
  // LinkedIn, Slack, WhatsApp, etc. -- reuses the same title/
  // description already approved above rather than writing separate
  // copy, so there's one consistent message regardless of where the
  // link surfaces.
  openGraph: {
    title: 'Hashtaglytics — Des prospects SEO local qualifiés, en France',
    description:
      'Nous scannons Google Maps commune par commune, qualifions chaque entreprise sur six signaux mesurés, et livrons un diagnostic prêt à envoyer — à votre nom.',
    url: 'https://hashtaglytics.com',
    siteName: 'Hashtaglytics',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Hashtaglytics — Trouvez les entreprises qui ont besoin de votre SEO local.',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hashtaglytics — Des prospects SEO local qualifiés, en France',
    description:
      'Nous scannons Google Maps commune par commune, qualifions chaque entreprise sur six signaux mesurés, et livrons un diagnostic prêt à envoyer — à votre nom.',
    images: ['/images/og-image.png'],
  },
};

// SiteHeader/SiteFooter/ScrollReveal moved OUT of here and into
// app/(site)/layout.tsx -- this layout wraps EVERY route including
// /app/*, so anything rendered here unconditionally shows up on the
// dashboard too. That was the actual cause of the double-nav bug: this
// file used to render SiteHeader/SiteFooter directly, with no way for
// /app/* to opt out short of a CSS hide (which would still ship the
// unused markup to every dashboard page -- a patch, not a fix).
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body
        className={`${instrumentSans.variable} ${ibmPlexMono400.variable} ${ibmPlexMono500.variable} ${ibmPlexMono600.variable}`}
        style={{
          fontFamily: 'var(--font-instrument), "Instrument Sans", system-ui, sans-serif',
        }}
      >
        {children}
        {/* Replace G-XXXXXXXXX with the real Measurement ID -- both
            occurrences below must match each other (the pasted
            reference snippet had two different IDs between the script
            src and the config call, which would have silently tracked
            under the wrong property). afterInteractive is Next.js's
            own recommended strategy for analytics scripts: loads after
            the page is interactive, not blocking initial render. */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-YGH3DCP49G"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('internal') === 'true') {
              gtag('set', 'traffic_type', 'internal');
            }

            gtag('config', 'G-YGH3DCP49G');
          `}
        </Script>
      </body>
    </html>
  );
}
