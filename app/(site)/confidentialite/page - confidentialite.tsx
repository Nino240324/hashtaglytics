import '../legal-sections.css';

export default function ConfidentialitePage() {
  return (
    <section className="legal">
      <div className="narrow">
        <span className="eyebrow">Légal</span>
        <h1>Politique de confidentialité</h1>
        <p className="updated">Dernière mise à jour : 5 septembre 2026</p>

        <div className="legal-body">
          {/* Cette page décrit une collecte que la personne concernée n'a pas
              initiée : c'est le cas prévu par l'article 14 du RGPD, et il
              impose une transparence plus large que l'article 13. La décrire
              honnêtement est à la fois l'obligation légale et la position la
              plus défendable — le site entier repose sur "nous mesurons et
              nous publions la méthode". */}
          <div className="legal-section">
            <h2>Qui traite vos données</h2>
            <p>
              Le responsable du traitement est <strong>[PRÉNOM NOM]</strong>,
              entrepreneur individuel, éditeur du site hashtaglytics.com.
              Contact :{' '}
              <a href="mailto:contact@hashtaglytics.com">contact@hashtaglytics.com</a>.
            </p>
          </div>

          <div className="legal-section">
            <h2>Données collectées</h2>
            <p>
              Nous traitons deux ensembles de données distincts.
            </p>
            <p>
              <strong>Les données des entreprises référencées.</strong> Nom
              commercial, adresse, numéro de téléphone, catégorie
              d&rsquo;activité, note et nombre d&rsquo;avis, nombre de photos,
              adresse du site web, position dans les résultats de recherche
              locale, et — lorsqu&rsquo;elle figure sur le site public de
              l&rsquo;entreprise — une adresse e-mail professionnelle.
            </p>
            <p>
              Ces informations concernent des établissements. Elles peuvent
              néanmoins constituer des données à caractère personnel lorsque
              l&rsquo;entreprise est exercée en nom propre — un artisan, une
              profession libérale — et nous les traitons alors comme telles,
              sans distinction.
            </p>
            <p>
              <strong>Les données des utilisateurs du service.</strong> Nom de
              l&rsquo;agence, adresse e-mail de connexion, mot de passe chiffré,
              et les coordonnées que vous choisissez de faire figurer sur vos
              documents.
            </p>
          </div>

          <div className="legal-section">
            <h2>Origine des données</h2>
            {/* La phrase qui compte : aucune liste achetée. Elle est vraie,
                elle est vérifiable, et elle nous distingue de la plupart des
                fournisseurs de leads. */}
            <p>
              <strong>Nous n&rsquo;achetons aucune liste et nous ne revendons
              aucune base de données tierce.</strong>
            </p>
            <p>
              Les informations proviennent de deux sources publiques. La première
              est Google Maps, que nous interrogeons point par point sur le
              territoire pour mesurer la visibilité locale des établissements. La
              seconde est le site web public de l&rsquo;entreprise elle-même,
              lorsqu&rsquo;il existe : nous en lisons la page d&rsquo;accueil et,
              le cas échéant, la page de contact ou les mentions légales, pour y
              relever une adresse e-mail et un numéro de téléphone
              professionnels.
            </p>
            <p>
              Nous ne consultons que des pages accessibles à tout visiteur, sans
              contourner de restriction d&rsquo;accès ni de mécanisme
              d&rsquo;authentification.
            </p>
          </div>

          <div className="legal-section">
            <h2>Finalité du traitement</h2>
            <p>
              Ces données servent à identifier les entreprises dont la visibilité
              locale est perfectible, à produire un diagnostic expliquant
              pourquoi, et à mettre ce diagnostic à disposition
              d&rsquo;agences de référencement susceptibles de leur proposer leurs
              services.
            </p>
            <p>
              Les agences clientes sont responsables de leurs propres
              démarches de prospection. Nous ne les effectuons pas en leur nom et
              n&rsquo;envoyons aucun message commercial aux entreprises
              référencées.
            </p>
          </div>

          <div className="legal-section">
            <h2>Base légale</h2>
            <p>
              Le traitement repose sur l&rsquo;<strong>intérêt légitime</strong>{' '}
              (article 6.1.f du RGPD) : proposer à des professionnels un service
              susceptible d&rsquo;améliorer leur visibilité commerciale.
            </p>
            {/* Le test de mise en balance n'est pas une formalité : il doit
                pouvoir être produit sur demande. Le résumer ici plutôt que de
                simplement invoquer l'intérêt légitime est la différence entre
                une base légale défendable et une base légale affirmée. */}
            <p>
              Cette base légale suppose une mise en balance entre notre intérêt et
              vos droits. Nous l&rsquo;avons conduite ainsi : les données traitées
              sont exclusivement professionnelles et déjà publiques ; elles ne
              révèlent rien de la vie privée, des opinions ou de la santé ; le
              traitement s&rsquo;inscrit dans le cadre attendu d&rsquo;une activité
              commerciale, où la sollicitation entre professionnels est usuelle ;
              et l&rsquo;effacement peut être obtenu immédiatement, sans
              justification.
            </p>
            <p>
              Les données des utilisateurs du service reposent, elles, sur
              l&rsquo;exécution du contrat qui nous lie (article 6.1.b).
            </p>
          </div>

          <div className="legal-section">
            <h2>Durée de conservation</h2>
            <p>
              Les coordonnées personnelles associées à une entreprise référencée —
              adresse e-mail, nom de contact — sont conservées{' '}
              <strong>vingt-quatre mois</strong> à compter de leur collecte, puis
              effacées automatiquement.
            </p>
            <p>
              Les mesures de visibilité elles-mêmes (position, avis, photos) sont
              conservées plus longtemps à des fins statistiques, mais elles ne
              contiennent alors plus aucune coordonnée personnelle.
            </p>
            <p>
              Les données de compte sont conservées pendant toute la durée de
              l&rsquo;abonnement, puis pendant la durée légale applicable aux
              documents comptables.
            </p>
          </div>

          <div className="legal-section">
            <h2>Droit à l&rsquo;effacement</h2>
            {/* La section la plus forte de la page, et elle décrit un mécanisme
                réel : effacement en quinze minutes, adresse ajoutée à une liste
                de suppression permanente qui empêche sa RÉACQUISITION lors d'un
                scan ultérieur. La plupart des acteurs suppriment ; peu
                empêchent le retour. */}
            <p>
              Vous pouvez demander à tout moment l&rsquo;effacement de vos données,
              sans avoir à motiver votre demande. Il suffit d&rsquo;écrire à{' '}
              <a href="mailto:contact@hashtaglytics.com">contact@hashtaglytics.com</a>{' '}
              depuis l&rsquo;adresse concernée, ou en indiquant l&rsquo;adresse à
              effacer.
            </p>
            <p>
              <strong>La demande est traitée automatiquement, sous quinze
              minutes.</strong> Vos coordonnées sont effacées de l&rsquo;ensemble
              de nos enregistrements, y compris de ceux déjà transmis à des
              agences clientes.
            </p>
            <p>
              Elles sont en outre ajoutées à une liste de suppression permanente.
              Concrètement : si votre site est de nouveau analysé dans six mois et
              que votre adresse y figure toujours, elle sera{' '}
              <strong>rejetée au moment de la collecte</strong> et ne réapparaîtra
              pas dans nos données. Un effacement qui ne survivrait pas au scan
              suivant ne serait pas un effacement.
            </p>
          </div>

          <div className="legal-section">
            <h2>Vos autres droits</h2>
            <p>
              Vous disposez également d&rsquo;un droit d&rsquo;accès, de
              rectification, de limitation, de portabilité, et d&rsquo;un droit
              d&rsquo;opposition au traitement. Ces demandes s&rsquo;exercent à la
              même adresse et reçoivent une réponse sous un mois au plus.
            </p>
            <p>
              Le droit d&rsquo;opposition mérite une précision : lorsqu&rsquo;un
              traitement repose sur l&rsquo;intérêt légitime, comme c&rsquo;est le
              cas ici, il s&rsquo;exerce sans condition et nous cessons le
              traitement.
            </p>
          </div>

          <div className="legal-section">
            <h2>Sous-traitants et destinataires des données</h2>
            {/* L'article 14.1.e du RGPD permet explicitement de désigner les
                "catégories de destinataires" plutôt que de les nommer. Les noms
                figurent au registre des traitements, qui est interne et produit
                sur demande d'une autorité. */}
            <p>
              Vos données peuvent être communiquées aux catégories de destinataires
              suivantes :
            </p>
            <p>
              — les <strong>agences de référencement clientes</strong>, qui
              reçoivent les coordonnées professionnelles et le diagnostic associé ;
              <br />— des <strong>prestataires techniques</strong> assurant
              l&rsquo;hébergement, l&rsquo;enrichissement et la vérification des
              coordonnées, situés dans l&rsquo;Union européenne et aux
              États-Unis ;<br />— notre <strong>prestataire de paiement</strong>,
              pour les seules données de facturation des utilisateurs du service.
            </p>
            <p>
              Les transferts hors Union européenne sont encadrés par les clauses
              contractuelles types de la Commission européenne. La liste nominative
              de nos sous-traitants figure à notre registre des traitements et peut
              être communiquée à toute autorité de contrôle qui en ferait la
              demande.
            </p>
            <p>
              Nous ne vendons ni ne cédons vos données à des fins publicitaires.
            </p>
          </div>

          <div className="legal-section">
            <h2>Contact et réclamation</h2>
            <p>
              Pour toute question ou demande :{' '}
              <a href="mailto:contact@hashtaglytics.com">contact@hashtaglytics.com</a>.
            </p>
            <p>
              Si notre réponse ne vous satisfait pas, vous pouvez introduire une
              réclamation auprès de la Commission nationale de l&rsquo;informatique
              et des libertés (CNIL), 3 place de Fontenoy, 75007 Paris —{' '}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
                cnil.fr
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
