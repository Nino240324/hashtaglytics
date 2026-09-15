'use client';

import Link from 'next/link';
import { useState } from 'react';
import './tarifs-fixes.css';

interface Tier {
  name: string;
  monthly: string;
  annual: string;
  prospects: string;
  keywords: number;
  regions: number;
  recommended?: boolean;
}

const TIERS: Tier[] = [
  { name: 'Trial',   monthly: '57\u00a0€',  annual: '570\u00a0€',   prospects: '100',   keywords: 1, regions: 1 },
  { name: 'Starter', monthly: '86\u00a0€',  annual: '860\u00a0€',   prospects: '200',   keywords: 1, regions: 1 },
  { name: 'Growth',  monthly: '143\u00a0€', annual: '1\u00a0430\u00a0€', prospects: '400',   keywords: 2, regions: 2, recommended: true },
  { name: 'Business',monthly: '287\u00a0€', annual: '2\u00a0870\u00a0€', prospects: '850',   keywords: 3, regions: 3 },
  { name: 'Premium', monthly: '503\u00a0€', annual: '5\u00a0030\u00a0€', prospects: '1\u00a0800', keywords: 5, regions: 5 },
];

function pluralize(n: number, singular: string, plural: string): string {
  return n === 1 ? `${n}\u00a0${singular}` : `${n}\u00a0${plural}`;
}

export default function TarifsPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  return (
    <section className="pricing">
      <div className="wrap">
        <span className="eyebrow">Tarifs</span>
        <h1>Cinq formules. Vous ne payez que le volume dont vous avez besoin.</h1>
        <p className="lede">
          Chaque formule correspond à un volume de prospects par mois, et au
          nombre de métiers et de zones que vous pouvez travailler en parallèle.
          Vous changez de formule quand vous voulez.
        </p>

        <div className="free-band">
          <div className="free-band-text">
            <h2>Commencez par dix prospects réels, gratuitement.</h2>
            <p>
              Créez votre compte et utilisez l'application gratuitement. Vous recevez 10 prospects qualifiés chaque mois, avec leur diagnostic. Sans carte bancaire.
            </p>
          </div>
          <Link href="/inscription" className="btn btn-primary free-band-cta">
            Créer mon compte
          </Link>
        </div>

        <div className="billing-toggle">
          <button
            className={billing === 'monthly' ? 'active' : ''}
            onClick={() => setBilling('monthly')}
            aria-pressed={billing === 'monthly'}
          >
            Mensuel
          </button>
          <button
            className={billing === 'annual' ? 'active' : ''}
            onClick={() => setBilling('annual')}
            aria-pressed={billing === 'annual'}
          >
            Annuel
          </button>
          {billing === 'annual' && <span className="annual-tag">2 mois offerts</span>}
        </div>

        <div className="tiers-wrap">
          <div className="tiers-badge-row">
            {TIERS.map((tier) => (
              <div key={tier.name} className="tiers-badge-cell">
                {tier.recommended && <span className="tier-badge">Le plus choisi</span>}
              </div>
            ))}
          </div>

          <div className="tiers">
            {TIERS.map((tier) => (
            <div key={tier.name} className={`tier${tier.recommended ? ' recommended' : ''}`}>
              {tier.recommended && (
                <span className="tier-badge tier-badge-mobile">
                  Le plus choisi
                </span>
              )}
              <h2 className="tier-name">{tier.name}</h2>

              <div className="price">
                {billing === 'monthly' ? tier.monthly : tier.annual}
                <span className="price-period">{billing === 'monthly' ? ' /mois' : ' /an'}</span>
              </div>
              <div className="price-note">
                {billing === 'annual' ? 'Facturé annuellement' : 'Sans engagement'}
              </div>

              <ul>
                <li>{tier.prospects} prospects qualifiés par mois</li>
                <li>{pluralize(tier.keywords, 'mot-clé', 'mots-clés')} · {pluralize(tier.regions, 'région', 'régions')}</li>
                <li>Diagnostic client en marque blanche</li>
                <li>Fiche prospect détaillée</li>
              </ul>

              <div className="tier-cta">
                <a href="/contact" className={`btn ${tier.recommended ? 'btn-primary' : 'btn-ghost'}`}>
                  Choisir {tier.name}
                </a>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
