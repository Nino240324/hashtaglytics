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

// Same logic as /app/prospects -- "13e -> 55e" when the business's rank
// varied across grid points, "42e" alone when it didn't, "—" only when
// never measured. Never renders "42e -> 42e", which would read as a bug.
function formatRankRange(p: Prospect): string {
  if (p.best_rank === null) return '\u2014';
  if (p.rank_spread !== null && p.rank_spread > 0) {
    return `${p.best_rank}e \u2192 ${p.worst_rank}e`;
  }
  return `${p.best_rank}e`;
}

const POLL_INTERVAL_MS = 3000;

type StageDone = {
  qualification: boolean;
  enrichment: boolean;
  delivery: boolean;
  sitesAnalysed: boolean;
  emailsVerified: boolean;
};
const NO_STAGES_DONE: StageDone = {
  qualification: false,
  enrichment: false,
  delivery: false,
  sitesAnalysed: false,
  emailsVerified: false,
};

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

  // Initial paint calls the same real fetchCampaignProgress the poll
  // uses, rather than a simulated seed -- the real numbers are shown
  // immediately, with no fake intermediate guess ever displayed. (An
  // earlier version of this comment explained avoiding this function for
  // the first paint because calling it would ADVANCE mock state -- that
  // was true of the old mock-era implementation, not the real,
  // read-only query this now is; calling it here doesn't mutate
  // anything, so that concern no longer applies.)
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchCampaign(campaignId),
      fetchCampaignProgress(campaignId),
      fetchProspectsForCampaign(campaignId),
    ]).then(([c, prog, matching]) => {
      if (cancelled) return;
      if (c === null || prog === null) {
        setNotFound(true);
        return;
      }
      setCampaign(c);
      setProgress(prog);
      prevProgressRef.current = prog;
      setProspects(matching);
    });
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
      // A count stuck at exactly 0 across two polls also "stopped
      // rising" -- without the > 0 check, a stage that never started at
      // all reads identically to one that genuinely finished. Applies
      // to these three, which have no fixed "eligible" denominator to
      // compare against (unlike the two below).
      const qualificationDone =
        scanDone && next.leadsQualified > 0 && prev !== null && next.leadsQualified === prev.leadsQualified;
      const enrichmentDone =
        qualificationDone && next.leadsEnriched > 0 && prev !== null && next.leadsEnriched === prev.leadsEnriched;
      const deliveryDone =
        enrichmentDone && next.leadsDelivered > 0 && prev !== null && next.leadsDelivered === prev.leadsDelivered;
      // Not "processed > 0 and stopped rising" -- not every delivered
      // lead is eligible (website_kind 'none' never gets
      // html_checked_at), so eligible may genuinely be 0, in which case
      // the stage is correctly done immediately, not stalled. Done means
      // every ELIGIBLE lead has been processed -- a definitive test
      // against the true denominator, not a stability heuristic.
      const sitesAnalysedDone = deliveryDone && next.sitesAnalysed === next.sitesEligible;
      // Deliberately NOT evaluated at all until the site stage is done --
      // emailsEligible depends on the site pass having found an address,
      // so early on it's near-zero for a reason unrelated to how many
      // addresses actually exist. Evaluating "0 = 0" before the site
      // pass has run would tick this done before its own dependency has
      // even started.
      const emailsVerifiedDone = sitesAnalysedDone && next.emailsVerified === next.emailsEligible;

      prevProgressRef.current = next;
      setProgress(next);
      setStageDone({
        qualification: qualificationDone,
        enrichment: enrichmentDone,
        delivery: deliveryDone,
        sitesAnalysed: sitesAnalysedDone,
        emailsVerified: emailsVerifiedDone,
      });

      const matching = await fetchProspectsForCampaign(campaignId);
      setProspects(matching);
    }

    if (stageDone.emailsVerified) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [campaign, campaignId, stageDone.emailsVerified]);

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

  // "Terminée" reflects all six stages, NOT campaigns.status -- that
  // column turns 'completed' the moment the scan alone finishes
  // (complete_grid_point), while enrichment/delivery/site-analysis/
  // email-verification all still run afterwards. Read directly, before
  // #19b and #24 ever ran, it would call a campaign finished while two
  // of its six stages sat at zero. failed/paused/quota_reached are
  // genuine, separate interruptions, not about stage completion at all,
  // so those still come from campaigns.status directly.
  //
  // campaigns.status ITSELF is never written here -- enforce_max_campaigns
  // counts it, and holding a campaign "active" until emails verify would
  // block a free-tier agency from starting another for hours after their
  // leads already arrived.
  const allStagesDone =
    scanDone &&
    stageDone.qualification &&
    stageDone.enrichment &&
    stageDone.delivery &&
    stageDone.sitesAnalysed &&
    stageDone.emailsVerified;
  const displayStatusLabel =
    campaign.status === 'failed' || campaign.status === 'paused' || campaign.status === 'quota_reached'
      ? STATUS_LABELS[campaign.status]
      : allStagesDone
        ? 'Terminée'
        : 'En cours';

  // leadsDelivered comes directly from the real query now (fetchCampaignProgress
  // -- campaign_progress_view, one row per delivered lead) -- no separate
  // client-side percentage guess or capping logic involved.
  const visibleProspects = prospects.slice(0, progress.leadsDelivered);

  return (
    <div>
      <div className="page-head">
        <h1>
          {capitalize(campaign.keyword)} · {campaign.commune.nom}
        </h1>
      </div>

      <div className="campaign-detail-meta">
        <span className={`badge ${allStagesDone ? 'badge-ok' : 'badge-neutral'}`}>
          {displayStatusLabel}
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
                {progress.businesses} entreprises scannées
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
            <div
              className={`scan-tick ${stageDone.sitesAnalysed ? 'done' : stageDone.delivery ? 'active' : ''}`}
            >
              <span className="scan-tick-icon" aria-hidden="true">
                {stageDone.sitesAnalysed ? '✓' : '○'}
              </span>
              Analyse du site{' '}
              <span className="mono-num scan-tick-count">
                {progress.sitesAnalysed}/{progress.sitesEligible}
              </span>
            </div>
            <div
              className={`scan-tick ${stageDone.emailsVerified ? 'done' : stageDone.sitesAnalysed ? 'active' : ''}`}
            >
              <span className="scan-tick-icon" aria-hidden="true">
                {stageDone.emailsVerified ? '✓' : '○'}
              </span>
              Vérification e-mail{' '}
              <span className="mono-num scan-tick-count">
                {/* emailsEligible isn't meaningful until the site pass has
                    run -- a dash here is honest; "0/0" would look like a
                    real, finished count rather than "not yet knowable". */}
                {stageDone.sitesAnalysed ? `${progress.emailsVerified}/${progress.emailsEligible}` : '\u2014'}
              </span>
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
                      <td className="mono-num" data-label="Position">{formatRankRange(p)}</td>
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
