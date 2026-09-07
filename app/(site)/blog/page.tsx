// app/(site)/blog/page.tsx

import Link from 'next/link';
import { getAllEtudes, type EtudeMeta } from '@/lib/etudes';

export default function EtudesPage() {
  const etudes = getAllEtudes();

  return (
    <>
      <header className="etudes-head">
        <div className="wrap">
          <span className="eyebrow">Blog</span>
          <h1>Ce que nous mesurons sur le référencement local français.</h1>
          <p>
            Nous scannons Google Maps pour construire notre inventaire de prospects.
            Ce que les données révèlent au passage est publié ici — y compris quand
            cela contredit ce qu&rsquo;on lit partout.
          </p>

          <div className="pledge">
            <div>
              <div className="k">Données</div>
              <div className="v">Les nôtres. Aucune étude reprise, aucun chiffre américain traduit.</div>
            </div>
            <div>
              <div className="k">Échantillon</div>
              <div className="v">Le <em>n</em> est indiqué sous chaque chiffre. Sans lui, ce n&rsquo;est pas une mesure.</div>
            </div>
            <div>
              <div className="k">Méthode</div>
              <div className="v">Décrite en fin d&rsquo;article, avec ses limites.</div>
            </div>
          </div>
        </div>
      </header>

      <section className="list">
        <div className="wrap">
          {etudes.map((etude, i) => (
            <EtudePost key={etude.slug} etude={etude} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}

function EtudePost({ etude, index }: { etude: EtudeMeta; index: number }) {
  const isDraft = etude.status === 'draft';
  const studyNum = String(index + 1).padStart(2, '0');

  return (
    <div className={`post${isDraft ? ' soon' : ''}`}>
      <div className="meta">
        {isDraft ? 'À paraître' : 'Publié'}<br />
        Article {studyNum}
      </div>
      <div>
        <h2>
          {isDraft ? (
            <a href="#">{etude.title}</a>
          ) : (
            <Link href={`/blog/${etude.slug}`}>{etude.title}</Link>
          )}
        </h2>
        <p>{etude.standfirst}</p>
        <span className="n">{etude.sampleSize}</span>
      </div>
    </div>
  );
}
