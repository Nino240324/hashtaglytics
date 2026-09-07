// app/robots.ts

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/app/', // dashboard, behind auth regardless -- explicit is better than relying on that alone
        '/connexion',
        '/inscription',
        '/verifier',
        '/mot-de-passe-oublie',
        '/reinitialiser',
      ],
    },
    sitemap: 'https://hashtaglytics.com/sitemap.xml',
  };
}
