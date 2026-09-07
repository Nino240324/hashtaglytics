import '../legal-sections.css';

export default function MentionsLegalesPage() {
  return (
    <section className="legal">
      <div className="narrow">
        <span className="eyebrow">Légal</span>
        <h1>Mentions légales</h1>
        <p className="updated">Dernière mise à jour : 5 septembre 2026</p>

        <div className="legal-body">
          <div className="legal-section">
            <h2>Éditeur du site</h2>
            <p>
              Le site <strong>hashtaglytics.com</strong> est édité par{' '}
              <strong>[PRÉNOM NOM]</strong>, entrepreneur individuel exerçant sous le
              régime de la micro-entreprise.
            </p>
            <p>
              Siège social : [ADRESSE COMPLÈTE]<br />
              SIREN : [À COMPLÉTER] — SIRET : [À COMPLÉTER]<br />
              Code APE : [À COMPLÉTER]<br />
              E-mail :{' '}
              <a href="mailto:contact@hashtaglytics.com">contact@hashtaglytics.com</a>
            </p>
            {/* Article 293 B du CGI. Une micro-entreprise sous les seuils de
                franchise ne facture pas de TVA, et la mention est OBLIGATOIRE
                sur les factures comme sur le site. Son absence est une
                irrégularité, pas un oubli anodin. */}
            <p>
              TVA non applicable, article 293 B du Code général des impôts. Les prix
              affichés sur ce site sont nets de taxe.
            </p>
          </div>

          <div className="legal-section">
            <h2>Directeur de la publication</h2>
            <p>
              <strong>[PRÉNOM NOM]</strong>, en qualité d&rsquo;éditeur du site.
            </p>
          </div>

          <div className="legal-section">
            <h2>Hébergement</h2>
            {/* Vérifié 2026-09-05 auprès du registre d'entreprise et de l'avis
                de confidentialité de Vercel. L'adresse de Walnut, CA que l'on
                trouve dans de nombreuses mentions légales françaises est une
                ANCIENNE adresse postale, remplacée depuis. */}
            <p>
              Le site est hébergé par <strong>Vercel Inc.</strong><br />
              440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis<br />
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
                vercel.com
              </a>{' '}
              — <a href="mailto:privacy@vercel.com">privacy@vercel.com</a>
            </p>
            <p>
              Représentant de Vercel Inc. dans l&rsquo;Union européenne : EDPO, Avenue
              Huart Hamoir 71, 1030 Bruxelles, Belgique.
            </p>
            <p>
              Les données applicatives sont hébergées par{' '}
              <strong>Supabase Inc.</strong>, sur une infrastructure située dans
              l&rsquo;Union européenne.
            </p>
          </div>

          <div className="legal-section">
            <h2>Propriété intellectuelle</h2>
            <p>
              L&rsquo;ensemble des contenus de ce site — textes, mise en page, éléments
              graphiques, logo et code source — est la propriété exclusive de
              l&rsquo;éditeur, à l&rsquo;exception des marques et logos appartenant à des
              tiers, cités à titre informatif.
            </p>
            {/* Les études sont publiées pour être citées — les verrouiller irait
                à l'encontre de leur raison d'être. Mais elles restent notre
                mesure, et l'attribution n'est pas négociable. */}
            <p>
              Les données statistiques publiées dans la section <em>Études</em> peuvent
              être citées et reprises, à condition de mentionner leur source et de
              renvoyer vers la page d&rsquo;origine. Toute reproduction intégrale du
              site, en revanche, est interdite sans autorisation écrite préalable.
            </p>
          </div>

          <div className="legal-section">
            <h2>Contact</h2>
            <p>
              Pour toute question relative au site ou à son contenu :{' '}
              <a href="mailto:contact@hashtaglytics.com">contact@hashtaglytics.com</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
