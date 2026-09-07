import './homepage-new-sections.css';

export default function Home() {
  return (
    <>
      <header className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">Prospection SEO local — France</span>
            <h1>
              Trouvez les entreprises <em>que vous pouvez aider</em> à mieux se positionner sur
              Google Maps.
            </h1>
            <p className="sub">
              Nous identifions les entreprises mal positionnées dans leur marché local, vérifions
              leurs principaux signaux de visibilité et vous livrons chaque prospect avec la raison
              de l&rsquo;appeler et le diagnostic à lui envoyer.
            </p>
            <div className="cta">
              <a href="/inscription" className="btn btn-primary">Créer mon compte gratuitement</a>
              <a href="#methode" className="btn btn-ghost">Voir comment ça marche</a>
            </div>
            <p className="fine">10 prospects offerts chaque mois · Sans carte bancaire</p>
          </div>

          <div className="demo-frame">
            <div className="demo-cap">
              <span className="q">« menuisier lyon 3 » — Google Maps</span>
              <span className="q">Exemple réel, anonymisé</span>
            </div>

            <div className="card">
              <div className="pin">1</div>
              <div>
                <div className="nm">Atelier Bois &amp; Cie</div>
                <div className="st"><span className="stars">★★★★★</span> 4,8 — 72 avis</div>
              </div>
            </div>
            <div className="card">
              <div className="pin">2</div>
              <div>
                <div className="nm">Menuiserie Rhône Agencement</div>
                <div className="st"><span className="stars">★★★★☆</span> 4,6 — 48 avis</div>
              </div>
            </div>
            <div className="card">
              <div className="pin">3</div>
              <div>
                <div className="nm">L&rsquo;Atelier du Meuble</div>
                <div className="st"><span className="stars">★★★★☆</span> 4,4 — 24 avis</div>
              </div>
            </div>

            <div className="gap-row">13 autres avant votre prospect</div>

            <div className="card you">
              <div className="pin">17</div>
              <div>
                <div className="nm">Votre prospect</div>
                <div className="st"><span className="stars">★★★★☆</span> 4,2 — 7 avis</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="product" id="produit">
        <div className="wrap">
          <h2>Le produit</h2>
          <p className="lede">Un prospect, une raison de l&rsquo;appeler.</p>

          <div className="product-flow">
            <div className="product-line" aria-hidden="true"></div>
            <div className="product-stage">
              <span className="node" aria-hidden="true"></span>
              <span className="stage-num">01</span>
              <h3>Trouvé</h3>
              <p>Une entreprise qui correspond au marché et à la zone que vous ciblez.</p>
            </div>
            <div className="product-stage">
              <span className="node" aria-hidden="true"></span>
              <span className="stage-num">02</span>
              <h3>Qualifié</h3>
              <p>Sa visibilité locale est mesurée et comparée à celle de ses concurrents.</p>
            </div>
            <div className="product-stage">
              <span className="node" aria-hidden="true"></span>
              <span className="stage-num">03</span>
              <h3>Diagnostiqué</h3>
              <p>Nous identifions ce qui limite aujourd&rsquo;hui sa visibilité sur Google Maps.</p>
            </div>
            <div className="product-stage">
              <span className="node" aria-hidden="true"></span>
              <span className="stage-num">04</span>
              <h3>Argument</h3>
              <p>Vous savez pourquoi l&rsquo;appeler et quel problème concret lui présenter.</p>
            </div>
            <div className="product-stage">
              <span className="node" aria-hidden="true"></span>
              <span className="stage-num">05</span>
              <h3>Prêt à envoyer</h3>
              <p>Un diagnostic clair, sous votre marque, que vous pouvez lui transmettre directement.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="how" id="methode">
        <div className="wrap">
          <h2>Comment nous les trouvons</h2>
          <div className="steps">
            <div className="step">
              <span className="num">Étape 1</span>
              <h3>Un scan point par point</h3>
              <p>
                Nous avons découpé chaque zone de recherche en une multitude de points pour
                mesurer la visibilité locale directement dans Google Maps — et révéler les
                entreprises qui passent sous le radar.
              </p>
            </div>
            <div className="step">
              <span className="num">Étape 2</span>
              <h3>La qualification</h3>
              <p>
                Position, avis, photos, fiche Google, site web, titre : nous mesurons ce qui
                compte pour la visibilité locale, et nous le comparons aux trois premiers du
                même point de mesure — pas à une moyenne nationale.
              </p>
            </div>
            <div className="step">
              <span className="num">Étape 3</span>
              <h3>Un diagnostic à votre nom</h3>
              <p>
                Votre logo, vos couleurs, vos coordonnées. Aucune
                mention de nous. Le prospect pense que vous l&rsquo;avez préparé —
                parce que c&rsquo;est le cas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="interface" id="interface">
        <div className="wrap">
          <h2>L&rsquo;interface</h2>
          <p className="lede">
            Ce que vous voyez en vous connectant. Pas une liste dans un tableur — un
            tableau de bord qui reçoit vos prospects au fur et à mesure qu&rsquo;ils sont
            trouvés et qualifiés.
          </p>

          <div className="interface-window">
            <div className="interface-window-bar">
              <span className="interface-dot dot-1" aria-hidden="true"></span>
              <span className="interface-dot dot-2" aria-hidden="true"></span>
              <span className="interface-dot dot-3" aria-hidden="true"></span>
              <span className="interface-window-url">hashtaglytics.com/app/prospects</span>
            </div>

            <div className="interface-mock">
              <div className="interface-mock-head">
                <h3>Plombier · Lille</h3>
                <span>124 opportunités</span>
              </div>
              <div className="interface-mock-cols">
                <span>Entreprise</span>
                <span>Position</span>
                <span>Potentiel</span>
                <span>Fiche Google</span>
                <span>Site web</span>
              </div>

              <details className="interface-row" open>
                <summary>
                  <div className="biz-cell">
                    <span className="chevron" aria-hidden="true">▸</span>
                    <div>
                      <div className="biz">Plomberie Vasseur</div>
                      <div className="loc">Lille</div>
                    </div>
                  </div>
                  <span className="mono-num">6</span>
                  <span className="mono-num">71 %</span>
                  <span className="interface-badge bad">Non revendiquée</span>
                  <span className="interface-badge bad">Aucun site</span>
                </summary>
                <div className="interface-detail">
                  <div className="detail-col">
                    <h4>Contact</h4>
                    <div className="detail-field"><span>Téléphone</span><strong>03 20 14 52 30</strong></div>
                    <div className="detail-field"><span>E-mail</span><strong className="pending">Pas encore traité</strong></div>
                  </div>
                  <div className="detail-col">
                    <h4>Fiche Google</h4>
                    <div className="detail-field"><span>Statut</span><strong>Non revendiquée</strong></div>
                    <div className="detail-field"><span>Complétude</span><strong>38 %</strong></div>
                    <div className="detail-field"><span>Avis</span><strong>9</strong></div>
                    <div className="detail-field"><span>Note</span><strong>3,6</strong></div>
                    <div className="detail-field"><span>Photos</span><strong>Aucune photo</strong></div>
                  </div>
                  <div className="detail-col">
                    <h4>Site web</h4>
                    <div className="detail-field"><span>Type</span><strong>Aucun</strong></div>
                  </div>
                  <div className="detail-col">
                    <h4>Mesures</h4>
                    <div className="detail-field"><span>Position</span><strong>6</strong></div>
                    <div className="detail-field"><span>Potentiel</span><strong>71 %</strong></div>
                  </div>
                </div>
              </details>

              <details className="interface-row">
                <summary>
                  <div className="biz-cell">
                    <span className="chevron" aria-hidden="true">▸</span>
                    <div>
                      <div className="biz">SOS Plomberie Nord</div>
                      <div className="loc">Lille</div>
                    </div>
                  </div>
                  <span className="mono-num">4</span>
                  <span className="mono-num">58 %</span>
                  <span className="interface-badge ok">Revendiquée</span>
                  <span className="interface-badge bad">Aucun site</span>
                </summary>
                <div className="interface-detail">
                  <div className="detail-col">
                    <h4>Contact</h4>
                    <div className="detail-field"><span>Téléphone</span><strong>03 20 08 17 44</strong></div>
                    <div className="detail-field"><span>E-mail</span><strong>contact@sosplomberienord.fr</strong></div>
                  </div>
                  <div className="detail-col">
                    <h4>Fiche Google</h4>
                    <div className="detail-field"><span>Statut</span><strong>Revendiquée</strong></div>
                    <div className="detail-field"><span>Complétude</span><strong>61 %</strong></div>
                    <div className="detail-field"><span>Avis</span><strong>14</strong></div>
                    <div className="detail-field"><span>Note</span><strong>4,1</strong></div>
                    <div className="detail-field"><span>Photos</span><strong>3</strong></div>
                  </div>
                  <div className="detail-col">
                    <h4>Site web</h4>
                    <div className="detail-field"><span>Type</span><strong>Aucun</strong></div>
                  </div>
                  <div className="detail-col">
                    <h4>Mesures</h4>
                    <div className="detail-field"><span>Position</span><strong>4</strong></div>
                    <div className="detail-field"><span>Potentiel</span><strong>58 %</strong></div>
                  </div>
                </div>
              </details>

              <details className="interface-row">
                <summary>
                  <div className="biz-cell">
                    <span className="chevron" aria-hidden="true">▸</span>
                    <div>
                      <div className="biz">Chauffage Leroy &amp; Fils</div>
                      <div className="loc">Lille</div>
                    </div>
                  </div>
                  <span className="mono-num">11</span>
                  <span className="mono-num">66 %</span>
                  <span className="interface-badge bad">Non revendiquée</span>
                  <span className="interface-badge neutral">Site propre</span>
                </summary>
                <div className="interface-detail">
                  <div className="detail-col">
                    <h4>Contact</h4>
                    <div className="detail-field"><span>Téléphone</span><strong>03 20 55 09 12</strong></div>
                    <div className="detail-field"><span>E-mail</span><strong className="pending">Pas encore traité</strong></div>
                  </div>
                  <div className="detail-col">
                    <h4>Fiche Google</h4>
                    <div className="detail-field"><span>Statut</span><strong>Non revendiquée</strong></div>
                    <div className="detail-field"><span>Complétude</span><strong>45 %</strong></div>
                    <div className="detail-field"><span>Avis</span><strong>22</strong></div>
                    <div className="detail-field"><span>Note</span><strong>4,3</strong></div>
                    <div className="detail-field"><span>Photos</span><strong>1</strong></div>
                  </div>
                  <div className="detail-col">
                    <h4>Site web</h4>
                    <div className="detail-field"><span>Type</span><strong>Site propre</strong></div>
                  </div>
                  <div className="detail-col">
                    <h4>Mesures</h4>
                    <div className="detail-field"><span>Position</span><strong>11</strong></div>
                    <div className="detail-field"><span>Potentiel</span><strong>66 %</strong></div>
                  </div>
                </div>
              </details>

              <details className="interface-row">
                <summary>
                  <div className="biz-cell">
                    <span className="chevron" aria-hidden="true">▸</span>
                    <div>
                      <div className="biz">Dubois Plomberie Chauffage</div>
                      <div className="loc">Lille</div>
                    </div>
                  </div>
                  <span className="mono-num">15</span>
                  <span className="mono-num">44 %</span>
                  <span className="interface-badge ok">Revendiquée</span>
                  <span className="interface-badge bad">Aucun site</span>
                </summary>
                <div className="interface-detail">
                  <div className="detail-col">
                    <h4>Contact</h4>
                    <div className="detail-field"><span>Téléphone</span><strong>03 20 41 28 90</strong></div>
                    <div className="detail-field"><span>E-mail</span><strong>contact@dubois-pc.fr</strong></div>
                  </div>
                  <div className="detail-col">
                    <h4>Fiche Google</h4>
                    <div className="detail-field"><span>Statut</span><strong>Revendiquée</strong></div>
                    <div className="detail-field"><span>Complétude</span><strong>72 %</strong></div>
                    <div className="detail-field"><span>Avis</span><strong>31</strong></div>
                    <div className="detail-field"><span>Note</span><strong>4,5</strong></div>
                    <div className="detail-field"><span>Photos</span><strong>6</strong></div>
                  </div>
                  <div className="detail-col">
                    <h4>Site web</h4>
                    <div className="detail-field"><span>Type</span><strong>Aucun</strong></div>
                  </div>
                  <div className="detail-col">
                    <h4>Mesures</h4>
                    <div className="detail-field"><span>Position</span><strong>15</strong></div>
                    <div className="detail-field"><span>Potentiel</span><strong>44 %</strong></div>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      <section className="deliver" id="documents">
        <div className="wrap">
          <h2>Le diagnostic, pas une liste.</h2>
          <p className="lede">Chaque prospect arrive avec son diagnostic.</p>
          <p className="lede">
            Vous ne recevez pas seulement une entreprise à contacter. Chaque prospect est
            accompagné des éléments qui expliquent pourquoi il représente une opportunité : sa
            position, ses points faibles, son environnement concurrentiel et les éléments à
            améliorer.
          </p>

          <div className="doc-grid">
            <div className="doc">
              <span className="who">Pour le prospect</span>
              <h3>Le diagnostic</h3>
              <p>
                Trois pages en marque blanche : votre logo, votre couleur, vos coordonnées. Aucun
                score, aucun jargon, aucune mention de nous. Ce qu&rsquo;un artisan comprend en
                quelques secondes.
              </p>
              <a className="doc-shot" href="/documents/exemple-diagnostic.pdf" target="_blank" rel="noopener">
                <img
                  src="/images/apercu-diagnostic.png"
                  alt="Première page du diagnostic client : le pack Google Maps, les trois premiers, et la position du prospect en dix-septième."
                  width={1240}
                  height={876}
                  loading="lazy"
                />
              </a>
              <a className="doc-link" href="/documents/exemple-diagnostic.pdf" target="_blank" rel="noopener">
                Voir le PDF complet
              </a>
            </div>

            <div className="doc">
              <span className="who">Pour vous</span>
              <h3>La fiche prospect</h3>
              <p>
                Deux pages, à notre nom, jamais transmises au prospect. La difficulté du marché,
                ce qui est rattrapable et ce qui se gagne, les coordonnées vérifiées, et un angle
                d&rsquo;entrée suggéré.
              </p>
              <a className="doc-shot" href="/documents/exemple-fiche-prospect.pdf" target="_blank" rel="noopener">
                <img
                  src="/images/apercu-fiche-prospect.png"
                  alt="Première page de la fiche prospect : difficulté du marché, coordonnées vérifiées, et répartition du score."
                  width={1240}
                  height={876}
                  loading="lazy"
                />
              </a>
              <a className="doc-link" href="/documents/exemple-fiche-prospect.pdf" target="_blank" rel="noopener">
                Voir le PDF complet
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="study" id="mesures">
        <div className="wrap">
          <h2>Ce que nous avons mesuré sur le marché français</h2>
          <p className="lede">
            Nous n&rsquo;achetons pas de listes. Nous scannons, nous mesurons, et nous
            publions ce que les données disent — y compris quand cela contredit
            ce qu&rsquo;on lit partout.
          </p>

          <div className="rows">
            <div className="row">
              <span className="fig">57 %</span>
              <span className="txt">des entreprises exploitables n&rsquo;ont aucun site web. Ni le leur, ni celui d&rsquo;un tiers — rien.</span>
              <span className="n">n = 13 883</span>
            </div>
            <div className="row">
              <span className="fig">39 %</span>
              <span className="txt">des entreprises exploitables n&rsquo;ont jamais revendiqué leur fiche Google. Elles ne peuvent pas répondre à leurs avis.</span>
              <span className="n">n = 13 883</span>
            </div>
            <div className="row">
              <span className="fig">24 %</span>
              <span className="txt">des sites d&rsquo;entreprises françaises n&rsquo;ont aucun titre principal sur leur page d&rsquo;accueil.</span>
              <span className="n">n = 15 539</span>
            </div>
            <div className="row">
              <span className="fig">30 %</span>
              <span className="txt">des entreprises présentes dans le pack local n&rsquo;ont pas de site web du tout. Le site n&rsquo;est pas ce qui les y a mises.</span>
              <span className="n">n = 30 800</span>
            </div>
            <div className="row">
              <span className="fig">19 %</span>
              <span className="txt">affichent sur leur site un numéro différent de celui de leur fiche Google.</span>
              <span className="n">n = 9 400</span>
            </div>
          </div>

          <p className="foot">
            Onze métiers, quatre régions, 30 000 entreprises analysées entre juillet
            et août 2026. Méthodologie détaillée sur demande.
          </p>
        </div>
      </section>

      <section className="faq" id="faq">
        <div className="wrap">
          <h2>Questions fréquentes</h2>
          <div className="faq-list">
            <details>
              <summary>D&rsquo;où viennent ces entreprises ?</summary>
              <div className="a">
                De Google Maps, scanné point par point sur le territoire français.
                Nous n&rsquo;achetons aucune liste et nous ne revendons rien : chaque
                entreprise est trouvée, mesurée et qualifiée par notre propre
                pipeline.
              </div>
            </details>

            <details>
              <summary>Le prospect saura-t-il que le document ne vient pas de moi ?</summary>
              <div className="a">
                Non. Le diagnostic porte <b>votre logo, votre couleur et vos
                coordonnées</b>, et ne mentionne notre nom nulle part. La fiche
                prospect, elle, ne quitte jamais votre bureau.
              </div>
            </details>

            <details>
              <summary>Les mêmes prospects sont-ils vendus à plusieurs agences ?</summary>
              <div className="a">
                Une même entreprise peut apparaître chez deux agences travaillant
                la même zone et le même métier.
              </div>
            </details>

            <details>
              <summary>À quelle fréquence les données sont-elles mises à jour ?</summary>
              <div className="a">
                Chaque mesure porte sa date, visible en bas du diagnostic. Les
                données sont rafraîchies avant livraison : un classement, un
                nombre d&rsquo;avis ou un site web peuvent changer en quelques semaines,
                et un document périmé se retourne contre vous.
              </div>
            </details>

            <details>
              <summary>Et le RGPD ?</summary>
              <div className="a">
                Les adresses e-mail proviennent des sites publics des entreprises
                elles-mêmes. Toute demande d&rsquo;effacement est traitée sous quinze
                minutes et l&rsquo;adresse est <b>définitivement</b> exclue de nos
                scans — pas seulement supprimée, mais empêchée de revenir.
              </div>
            </details>

            <details>
              <summary>Puis-je essayer avant de payer ?</summary>
              <div className="a">
                Oui. Dites-nous votre métier et votre zone : nous envoyons dix
                prospects réels avec leur diagnostic, sous votre marque, sans
                carte bancaire.
              </div>
            </details>
          </div>
        </div>
      </section>

      <section className="close" id="commencer">
        <div className="wrap">
          <h2>Créez votre compte et découvrez vos 10 premiers prospects.</h2>
          <p>
            Aucun engagement, aucune carte bancaire. Vous choisissez votre métier et votre zone,
            nous nous occupons du reste.
          </p>
          <div className="cta">
            <a href="/inscription" className="btn btn-primary">Commencez gratuitement</a>
            <a href="/tarifs" className="btn btn-ghost">Voir les tarifs</a>
          </div>
        </div>
      </section>
    </>
  );
}
