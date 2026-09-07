// app/(site)/blog/[slug]/page.tsx

import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllEtudes, getEtudeBySlug } from '@/lib/etudes';

export async function generateStaticParams() {
  return getAllEtudes()
    .filter((e) => e.status === 'published')
    .map((e) => ({ slug: e.slug }));
}

export default async function EtudeArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const etude = getEtudeBySlug(slug);

  if (!etude) notFound();

  const { meta, content } = etude;

  return (
    <article style={{ borderTop: '1px solid var(--rule)' }}>
      <div className="narrow">
        <span className="eyebrow">Article · {meta.date}</span>
        <h1>{meta.title}</h1>
        <p className="standfirst">{meta.standfirst}</p>
        <div className="byline">
          Hashtaglytics · {meta.date} · {meta.readingTime}
        </div>

        <MDXRemote source={content} />

        <div className="cta-end">
          <p>
            Nous mesurons ces signaux pour identifier les entreprises qui ont le
            plus à gagner — et nous les livrons aux agences avec un diagnostic
            prêt à envoyer.
          </p>
          <p style={{ marginTop: 20 }}>
            <a className="btn btn-primary" href="/#tarifs">Recevoir un échantillon gratuit</a>
          </p>
        </div>
      </div>
    </article>
  );
}
