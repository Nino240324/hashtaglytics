// app/sitemap.ts

import type { MetadataRoute } from 'next';
import { getAllEtudes } from '@/lib/etudes';

const BASE_URL = 'https://hashtaglytics.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/tarifs`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/mentions-legales`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/confidentialite`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/cgv`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  // Same filter as blog/[slug]/page.tsx's generateStaticParams -- draft
  // ("À paraître") articles aren't live yet, shouldn't be in the sitemap
  // even though they exist in the data.
  const articlePages: MetadataRoute.Sitemap = getAllEtudes()
    .filter((e) => e.status === 'published')
    .map((e) => ({
      url: `${BASE_URL}/blog/${e.slug}`,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

  return [...staticPages, ...articlePages];
}
