// app/app/campagnes/[id]/campaign-detail-client.tsx
//
// Brief 5.3: "the screen a new user stares at for four minutes deciding
// whether to trust the product." Design points confirmed by Opus:
//   - Campaigns are one commune by construction -- one progress bar per
//     campaign is correct, not a simplification.
//   - A town campaign is 40-150 grid points, ~3 minutes end to end
//     (measured on Paris/Bordeaux/Lille). Poll every 3s; the poll itself
//     is cheap (bounded by total_grids), never poll anything unbounded.
//   - Only the scan stage has real granularity -- qualification,
//     enrichment and delivery are COUNTS, not booleans (they're per-lead
//     marker states -- see the comment on CampaignProgress in
//     mock-data.ts). A stage is "done" when its count stops rising AND
//     the stage below it has already finished -- detected by comparing
//     consecutive polls, not a timing heuristic.

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  fetchCampaign,
  fetchCampaignProgress,
  fetchProspectsForCampaign,
  computeCampaignFunnel,
  getEmailCellState,
  getFicheGoogleState,
  hasPhoneMismatch,
  type Campaign,
  type CampaignProgress,
  type Prospect,
} from '@/lib/mock-data';

const STATUS_LABELS: Record<Campaign['status'], string> = {
  in_progress: 'En cours',
  completed: 'Terminée',
  failed: 'Échouée',
  paused: 'En pause',
  quota_reached: 'Quota atteint',
};

const OUTCOME_LABELS: Record<NonNullable<Prospect['outcome']>, string> = {
  won: 'Gagné',
  lost: 'Ignoré',
  no_response: 'Sans réponse',
  in_progress: 'En cours',
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatPhoneFR(e164: string | null): string {
  if (!e164) return '—';
  if (!e164.startsWith('+33')) return e164;
  const national = `0${e164.slice(3)}`;
  return national.replace(/(\d{2})(?=\d)/g, '$1 ');
}

const POLL_INTERVAL_MS = 3000;

type StageDone = { qualification: boolean; enrichment: boolean; delivery: boolean };
const NO_STAGES_DONE: StageDone = { qualification: false, enrichment: false, delivery: false };

export function CampaignDetailClient({ campaignId }: { campaignId: string }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [progress, setProgress] = useState<CampaignProgress | null>(null);
  const [stageDone, setStageDone] = useState<StageDone>(NO_STAGES_DONE);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Previous poll's counts -- "done" is detected by comparing consecutive
  // polls (a count that stopped rising), not a poll-counter or timer.
  const prevProgressRef = useRef<CampaignProgress | null>(null);

  // Initial paint uses fetchCampaign (read-only) to seed progress from the
  // campaign's CURRENT stored numbers, deliberately not
  // fetchCampaignProgress (which advances state every call it's given).
  // Calling the polling function for the very first paint would skip
  // straight past scanned === 0 on a fresh campaign -- Phase 1 would
  // never actually be visible, only ever inferable. The funnel counts are
  // computed the same way the live poll computes them, via the shared
  // pure function, so the first paint is consistent with every poll after
  // it -- not a different formula that happens to agree by coincidence.
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCampaign(campaignId), fetchProspectsForCampaign(campaignId)]).then(
      ([c, matching]) => {
        if (cancelled) return;
        if (c === null) {
          setNotFound(true);
          return;
        }
        setCampaign(c);
        const total = c.total_grids;
        const scanned = c.completed_grids;
        const scanPct = total > 0 ? scanned / total : 0;
        const funnel = computeCampaignFunnel(c.businesses_found, scanPct, matching.length);
        const initial: CampaignProgress = {
          total,
          scanned,
          inFlight: scanned >= total ? 0 : Math.min(8, total - scanned),
          businesses: c.businesses_found,
          ...funnel,
        };
        setProgress(initial);
        prevProgressRef.current = initial;
      },
    );
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  // Polling starts only once the initial (non-mutating) state above has
  // landed, and stops once delivery -- the final stage -- has stopped
  // rising in turn.
  useEffect(() => {
    if (campaign === null) return;

    async function tick() {
      const next = await fetchCampaignProgress(campaignId);
      if (next === null) return;
      const prev = prevProgressRef.current;

      const scanDone = next.scanned >= next.total;
      const qualificationDone =
        scanDone && prev !== null && next.leadsQualified === prev.leadsQualified;
      const enrichmentDone =
        qualificationDone && prev !== null && next.leadsEnriched === prev.leadsEnriched;
      const deliveryDone =
        enrichmentDone && prev !== null && next.leadsDelivered === prev.leadsDelivered;

      prevProgressRef.current = next;
      setProgress(next);
      setStageDone({ qualification: qualificationDone, enrichment: enrichmentDone, delivery: deliveryDone });

      const matching = await fetchProspectsForCampaign(campaignId);
      setProspects(matching);
    }

    if (stageDone.delivery) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [campaign, campaignId, stageDone.delivery]);

  if (notFound) {
    return (
      <div>
        <div className="page-head">
          <h1>Campagne introuvable</h1>
        </div>
        <p>
          <Link href="/app/campagnes">Retour aux campagnes</Link>
        </p>
      </div>
    );
  }

  if (campaign === null || progress === null) {
    return <p className="loading-text">Chargement…</p>;
  }

  const scanPct = progress.total > 0 ? Math.round((progress.scanned / progress.total) * 100) : 0;
  const scanDone = progress.scanned >= progress.total;
  const phase1 = progress.scanned === 0;

  // leadsDelivered from the poll IS the authoritative reveal count now --
  // no separate client-side percentage guess. It's already capped at
  // prospects.length inside computeCampaignFunnel, so slicing here is
  // just applying that count to the actual rows.
  const visibleProspects = prospects.slice(0, progress.leadsDelivered);

  return (
    <div>
      <div className="page-head">
        <h1>
          {capitalize(campaign.keyword)} · {campaign.commune.nom}
        </h1>
      </div>

      <div className="campaign-detail-meta">
        <span className={`badge ${scanDone ? 'badge-ok' : 'badge-neutral'}`}>
          {STATUS_LABELS[campaign.status]}
        </span>
        <span className="mono-num">
          {campaign.commune.dept_code} · {campaign.commune.region_name}
        </span>
      </div>

      {phase1 ? (
        <div className="scan-pending">
          <div className="scan-pending-illustration" aria-hidden="true">
            <div className="scan-robot-track">
              {/* Rendered twice (10 divs) so the marching loop is seamless
                  -- translateX(-50%) lands exactly on the duplicate,
                  making the wrap invisible. CSS hides the second set
                  under prefers-reduced-motion, since a static double row
                  would just look like a mistake once nothing is moving. */}
              {Array.from({ length: 10 }, (_, i) => (
                <div className="scan-robot" key={i}>
                  <span className="scan-robot-antenna" />
                  <span className="scan-robot-head">
                    <span className="scan-robot-eye" />
                    <span className="scan-robot-eye" />
                  </span>
                  <span className="scan-robot-body" />
                </div>
              ))}
            </div>
          </div>
          <p className="scan-pending-text">En attente de démarrage du balayage…</p>
        </div>
      ) : (
        <>
          <div className="scan-progress">
            <div
              className="progress-bar scan-progress-bar"
              role="progressbar"
              aria-label="Progression du balayage"
              aria-valuenow={scanPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="progress-bar-fill" style={{ width: `${scanPct}%` }} />
            </div>
            <div className="scan-progress-row">
              <span className="mono-num">
                {progress.scanned} / {progress.total} points balayés ({scanPct}%)
              </span>
              <span className="mono-num scan-businesses">
                {progress.businesses} entreprises trouvées
              </span>
            </div>
          </div>

          <div className="scan-stage-ticks">
            <div className="scan-tick done">
              <span className="scan-tick-icon" aria-hidden="true">
                ✓
              </span>
              Balayage
            </div>
            <div className={`scan-tick ${stageDone.qualification ? 'done' : scanDone ? 'active' : ''}`}>
              <span className="scan-tick-icon" aria-hidden="true">
                {stageDone.qualification ? '✓' : '○'}
              </span>
              Qualification <span className="mono-num scan-tick-count">{progress.leadsQualified}</span>
            </div>
            <div
              className={`scan-tick ${stageDone.enrichment ? 'done' : stageDone.qualification ? 'active' : ''}`}
            >
              <span className="scan-tick-icon" aria-hidden="true">
                {stageDone.enrichment ? '✓' : '○'}
              </span>
              Enrichissement <span className="mono-num scan-tick-count">{progress.leadsEnriched}</span>
            </div>
            <div className={`scan-tick ${stageDone.delivery ? 'done' : stageDone.enrichment ? 'active' : ''}`}>
              <span className="scan-tick-icon" aria-hidden="true">
                {stageDone.delivery ? '✓' : '○'}
              </span>
              Livraison <span className="mono-num scan-tick-count">{progress.leadsDelivered}</span>
            </div>
          </div>
        </>
      )}

      {visibleProspects.length > 0 && (
        <div className="campaign-leads">
          <div className="campaign-leads-head">
            <h2>
              {visibleProspects.length} prospect{visibleProspects.length > 1 ? 's' : ''} livré
              {visibleProspects.length > 1 ? 's' : ''}
            </h2>
            <Link href={`/app/prospects?campaign=${campaignId}`}>Voir tous les prospects →</Link>
          </div>
          <div className="campaign-leads-table-wrap">
            <table className="campaign-leads-table">
              <thead>
                <tr>
                  <th>Entreprise</th>
                  <th>Position</th>
                  <th>Potentiel</th>
                  <th>Fiche Google</th>
                  <th>E-mail</th>
                  <th>Téléphone</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {visibleProspects.map((p) => {
                  const ficheState = getFicheGoogleState(p);
                  const emailState = getEmailCellState(p);
                  return (
                    <tr key={p.id}>
                      <td className="cell-name" data-label="Entreprise">
                        <div className="biz">{p.business_name}</div>
                        <div className="loc">{p.city ?? 'Zone d\u2019intervention'}</div>
                      </td>
                      <td className="mono-num" data-label="Position">{p.maps_position}</td>
                      {/* Always populated -- delivered leads always have a
                          score (delivery orders by score). Same invariant
                          as /app/prospects. */}
                      <td className="mono-num" data-label="Potentiel">{100 - (p.seo_score as number)}%</td>
                      <td data-label="Fiche Google">
                        {ficheState === 'claimed' && <span className="badge badge-ok">Revendiquée</span>}
                        {ficheState === 'unclaimed' && (
                          <span className="badge badge-opportunity">Non revendiquée</span>
                        )}
                        {/* 'unknown' renders nothing, same rule as /app/prospects */}
                      </td>
                      <td data-label="E-mail">
                        {emailState === 'pending' && (
                          <span className="pending-cell">Pas encore traité</span>
                        )}
                        {emailState === 'no_email' && (
                          <span className="badge badge-neutral">Aucune adresse</span>
                        )}
                        {emailState === 'has_email' && (
                          <>
                            {p.email_status === 'deliverable' && (
                              <span className="badge badge-ok">Vérifié</span>
                            )}
                            {(p.email_status === 'risky' ||
                              p.email_status === 'pending_verification' ||
                              p.email_status === 'unknown') && (
                              <span className="badge badge-pending">Non garanti</span>
                            )}
                            {(p.email_status === null || p.email_status === 'invalid') && (
                              <span className="badge badge-neutral">Aucune adresse</span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="mono-num" data-label="Téléphone">
                        {formatPhoneFR(p.phone)}
                        {hasPhoneMismatch(p) && (
                          <span
                            className="phone-mismatch-marker"
                            role="img"
                            aria-label="Le num\u00e9ro affich\u00e9 sur le site diff\u00e8re de celui de la fiche Google"
                            title="Num\u00e9ro diff\u00e9rent sur le site"
                          >
                            {' '}
                            ⚠
                          </span>
                        )}
                      </td>
                      <td data-label="Statut">
                        {p.outcome === null ? (
                          <span className="badge badge-neutral">À traiter</span>
                        ) : (
                          <span className="badge badge-neutral">{OUTCOME_LABELS[p.outcome]}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
