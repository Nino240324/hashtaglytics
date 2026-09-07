import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface EtudeMeta {
  slug: string;
  title: string;
  standfirst: string;
  date: string;
  readingTime: string;
  sampleSize: string;
  status: 'published' | 'draft';
}

const CONTENT_DIR = path.join(process.cwd(), 'content', 'etudes');

export function getAllEtudes(): EtudeMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.mdx'));

  const etudes = files.map((filename) => {
    const slug = filename.replace(/\.mdx$/, '');
    const fullPath = path.join(CONTENT_DIR, filename);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const { data } = matter(raw);

    return {
      slug,
      title: data.title ?? slug,
      standfirst: data.standfirst ?? '',
      date: data.date ?? '',
      readingTime: data.readingTime ?? '',
      sampleSize: data.sampleSize ?? '',
      status: data.status ?? 'draft',
    } as EtudeMeta;
  });

  return etudes;
}

export function getEtudeBySlug(slug: string): { meta: EtudeMeta; content: string } | null {
  const fullPath = path.join(CONTENT_DIR, `${slug}.mdx`);

  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    meta: {
      slug,
      title: data.title ?? slug,
      standfirst: data.standfirst ?? '',
      date: data.date ?? '',
      readingTime: data.readingTime ?? '',
      sampleSize: data.sampleSize ?? '',
      status: data.status ?? 'draft',
    },
    content,
  };
}
