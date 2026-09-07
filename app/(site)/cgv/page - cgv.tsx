import '../legal-sections.css';

export default function CGVPage() {
  return (
    <section className="legal">
      <div className="narrow">
        <span className="eyebrow">Légal</span>
        <h1>Conditions générales de vente</h1>
        <p className="updated">Dernière mise à jour : 5 septembre 2026</p>

        <div className="legal-body">
          <div className="legal-section">
            <h2>Objet</h2>
            <p>
              Les présentes conditions générales régissent la fourniture, par{' '}
              <strong>[PRÉNOM NOM]</strong>, entrepreneur individuel, d&rsquo;un
              service de prospection locale qualifiée accessible à
              l&rsquo;adresse hashtaglytics.com.
            </p>
            {/* Distinction structurante : le service s'adresse à des
                professionnels. Elle détermine l'absence de droit de
                rétractation, plus bas. */}
            <p>
              Le service s&rsquo;adresse exclusivement à des professionnels agissant
              dans le cadre de leur activité — agences de référencement,
              consultants indépendants, prestataires de services marketing. La
              création d&rsquo;un compte vaut acceptation des présentes
              conditions.
            </p>
          </div>

          <div className="legal-section">
            <h2>Description du service</h2>
            <p>
              Le service identifie des entreprises dont la visibilité dans les
              résultats de recherche locale est perfectible, et livre pour chacune
              d&rsquo;elles un ensemble de mesures accompagné de deux documents.
            </p>
            <p>
              Le client choisit un métier et une commune. La plateforme interroge
              Google Maps sur une grille de points couvrant la zone, mesure la
              position et les principaux signaux de visibilité de chaque
              établissement trouvé, puis livre les prospects retenus, classés par
              potentiel.
            </p>
            <p>
              Chaque prospect est accompagné d&rsquo;un <strong>diagnostic</strong>{' '}
              en marque blanche, portant le logo, la couleur et les coordonnées du
              client et destiné à être transmis au prospect, ainsi que
              d&rsquo;une <strong>fiche prospect</strong> à usage interne.
            </p>
          </div>

          <div className="legal-section">
            <h2>Tarifs et modalités de paiement</h2>
            <p>
              Les tarifs en vigueur figurent sur la page{' '}
              <a href="/tarifs">Tarifs</a>. Ils sont exprimés en euros et{' '}
              <strong>nets de taxe</strong> : TVA non applicable, article 293 B du
              Code général des impôts.
            </p>
            <p>
              L&rsquo;abonnement est payable d&rsquo;avance, mensuellement ou
              annuellement selon la formule choisie, par carte bancaire via notre
              prestataire de paiement. Aucune coordonnée bancaire n&rsquo;est
              conservée sur nos serveurs.
            </p>
            <p>
              En cas d&rsquo;échec de paiement, l&rsquo;accès au service est
              suspendu après relance restée sans effet. Les données du compte sont
              conservées et l&rsquo;accès rétabli dès régularisation.
            </p>
          </div>

          <div className="legal-section">
            <h2>Quota et livraison des prospects</h2>
            {/* La section la plus susceptible de produire un litige : ce que le
                client croit avoir acheté contre ce qu'il reçoit. Deux
                distinctions doivent y être explicites — entreprises trouvées
                contre prospects livrés, et le fait qu'un quota ne se reporte
                pas. */}
            <p>
              Chaque formule ouvre droit à un nombre déterminé de{' '}
              <strong>prospects qualifiés livrés par mois</strong> et à un nombre
              maximal de campagnes simultanées.
            </p>
            <p>
              Ce quota porte sur les prospects <em>livrés</em>, et non sur les
              entreprises <em>trouvées</em>. Une campagne peut identifier plusieurs
              centaines d&rsquo;établissements ; seuls les mieux classés selon
              notre évaluation, dans la limite du quota, vous sont effectivement
              livrés.
            </p>
            <p>
              Le quota se renouvelle à chaque échéance de facturation et{' '}
              <strong>ne se reporte pas</strong> d&rsquo;une période sur la
              suivante. Une fois le quota atteint, les campagnes en cours
              continuent de fonctionner mais aucun nouveau prospect n&rsquo;est
              livré avant le renouvellement.
            </p>
            <p>
              Le nombre de prospects réellement livrés dépend du marché
              sélectionné. Une commune peu dense peut ne pas contenir assez
              d&rsquo;entreprises répondant à nos critères pour atteindre le
              quota : celui-ci constitue un plafond, non un engagement de volume.
            </p>
          </div>

          <div className="legal-section">
            <h2>Durée, renouvellement et résiliation</h2>
            <p>
              L&rsquo;abonnement est conclu pour la durée choisie et se renouvelle
              automatiquement par tacite reconduction, sauf résiliation.
            </p>
            <p>
              La résiliation s&rsquo;effectue à tout moment depuis
              l&rsquo;espace client et prend effet{' '}
              <strong>à la fin de la période en cours</strong>. Le service reste
              accessible jusqu&rsquo;à cette date. Aucun remboursement au prorata
              n&rsquo;est effectué pour une période entamée.
            </p>
            <p>
              Les prospects déjà livrés vous restent acquis après résiliation.
            </p>
          </div>

          <div className="legal-section">
            <h2>Responsabilité</h2>
            {/* Le point le plus important de la page : nous mesurons la
                visibilité, nous ne promettons pas de conversion. Une agence
                déçue de son taux de transformation ne doit pas pouvoir s'en
                prévaloir. */}
            <p>
              Le service fournit des <strong>mesures</strong> et un{' '}
              <strong>diagnostic</strong>. Il ne constitue en aucun cas une
              garantie de résultat commercial : nous ne garantissons ni la
              conversion des prospects livrés, ni leur disponibilité, ni leur
              intérêt pour vos services.
            </p>
            <p>
              Les données proviennent de sources publiques et reflètent
              l&rsquo;état observé à la date de mesure, indiquée sur chaque
              document. Une position, un nombre d&rsquo;avis ou un site web
              peuvent évoluer entre la mesure et votre prise de contact.
            </p>
            <p>
              Une même entreprise peut être livrée à plusieurs clients travaillant
              la même zone et le même métier. Aucune exclusivité n&rsquo;est
              accordée.
            </p>
            <p>
              Le client demeure seul responsable de ses démarches de prospection et
              du respect de la réglementation qui leur est applicable, notamment en
              matière de prospection électronique et de protection des données. Il
              lui appartient de tenir à jour ses propres listes
              d&rsquo;opposition.
            </p>
            <p>
              Notre responsabilité est limitée au montant des sommes versées au
              titre des douze derniers mois. Le service est fourni sans garantie de
              disponibilité ininterrompue ; les interruptions pour maintenance
              seront annoncées lorsque cela est possible.
            </p>
          </div>

          <div className="legal-section">
            <h2>Droit de rétractation</h2>
            {/* Ne pas se taire là-dessus. Le silence laisse croire à un oubli ;
                l'énoncer explicitement évite la réclamation. */}
            <p>
              Le droit de rétractation de quatorze jours prévu par le Code de la
              consommation s&rsquo;applique aux consommateurs. Le service
              s&rsquo;adressant exclusivement à des professionnels agissant dans le
              cadre de leur activité, <strong>ce droit ne trouve pas à
              s&rsquo;appliquer</strong>.
            </p>
            <p>
              La formule gratuite permet d&rsquo;évaluer le service — sa qualité de
              données comme ses documents — avant tout engagement payant.
            </p>
          </div>

          <div className="legal-section">
            <h2>Droit applicable et litiges</h2>
            <p>
              Les présentes conditions sont soumises au droit français.
            </p>
            <p>
              En cas de différend, les parties s&rsquo;efforceront de trouver une
              solution amiable avant toute action contentieuse. À défaut
              d&rsquo;accord, le litige sera porté devant les tribunaux compétents
              dans les conditions du droit commun.
            </p>
            <p>
              Nous nous réservons le droit de modifier les présentes conditions.
              Toute modification substantielle sera notifiée par e-mail au moins
              trente jours avant son entrée en vigueur, et vous pourrez résilier
              sans frais si elle ne vous convient pas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
