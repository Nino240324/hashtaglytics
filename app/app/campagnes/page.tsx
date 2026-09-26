// app/app/campagnes/page.tsx

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  createCampaign,
  fetchCampaignsOverview,
  completionPct,
  type AgencyPlanUsage,
  type Campaign,
  type Commune,
} from '@/lib/mock-data';
import { CommuneAutocomplete } from '../_components/commune-autocomplete';
import { Modal } from '../_components/modal';
import { LeadQuotaStat } from '../_components/lead-quota-stat';

const STATUS_LABELS: Record<Campaign['status'], string> = {
  in_progress: 'En cours',
  completed: 'Terminée',
  failed: 'Échouée',
  paused: 'En pause',
  quota_reached: 'Quota atteint',
};

function statusBadgeClass(status: Campaign['status']): string {
  if (status === 'completed') return 'badge badge-ok';
  if (status === 'failed') return 'badge badge-opportunity';
  if (status === 'quota_reached' || status === 'paused') return 'badge badge-pending';
  return 'badge badge-neutral'; // in_progress
}

function formatDateFR(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

// One card's ⋯ menu. Archive only -- campaign_grids and
// business_grid_positions cascade from campaigns, so deleting one would
// destroy paid-for scan history while the businesses themselves survive
// with their rank observations gone. campaigns.status has no 'archived'
// value yet, so this is a visible TODO, not a working action.
function CampaignMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div className="campaign-menu" ref={menuRef}>
      <button
        type="button"
        className="campaign-menu-trigger"
        aria-label="Actions"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((o) => !o);
        }}
      >
        ⋯
      </button>
      {open && (
        <div className="campaign-menu-list" role="menu">
          <button
            type="button"
            role="menuitem"
            disabled
            title="campaigns.status n'a pas encore de valeur 'archived' — pas encore câblé"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            Archiver
          </button>
        </div>
      )}
    </div>
  );
}

export default function CampagnesPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [planUsage, setPlanUsage] = useState<AgencyPlanUsage | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null);
  // [NEW] Held as a STRING, not a number. A number state forces a value
  // into an empty field (0 or NaN), so the user cannot clear it to retype
  // and the field can never legitimately be blank. Parsed on submit.
  const [leadsInput, setLeadsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { campaigns, planUsage } = await fetchCampaignsOverview();
    setCampaigns(campaigns);
    setPlanUsage(planUsage);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Change 1: this client-side check is a COURTESY, not the guarantee.
  // The real enforcement is a BEFORE INSERT trigger on campaigns that
  // takes an advisory lock on the agency id -- a second browser tab (or a
  // stale one that's been sitting open) can always get there first. This
  // disabled state exists so the form doesn't invite an attempt already
  // known to fail, not because the client can be trusted to be right.
  const atCampaignLimit =
    planUsage !== null &&
    planUsage.maxActiveCampaigns !== null &&
    planUsage.activeCampaigns >= planUsage.maxActiveCampaigns;

  // [NEW] What is left of this period's quota. null means unlimited (an
  // enterprise agreement), NOT zero -- the two must not be conflated or
  // an enterprise agency is locked out of its own form.
  //
  // THIS IS A COURTESY TOO. create_campaign re-reads lead_quota_periods
  // and raises its own French sentence if the number is wrong; this only
  // saves the round trip and gives the user the ceiling before they type.
  // A stale tab will always be able to get it wrong.
  const remainingQuota: number | null =
    planUsage === null || planUsage.max_leads_per_month === null
      ? null
      : Math.max(planUsage.max_leads_per_month - planUsage.leads_delivered_this_period, 0);

  // [NEW] Parsed once, used by both the validity check and the submit.
  // Number('') is 0 and Number('abc') is NaN, so both are rejected by the
  // >= 1 test below without a separate branch.
  const leadsTarget = Number(leadsInput.trim());
  const leadsTargetValid =
    Number.isInteger(leadsTarget) &&
    leadsTarget >= 1 &&
    (remainingQuota === null || leadsTarget <= remainingQuota);

  // [NEW] The inline message. Deliberately NOT shown while the field is
  // empty: an error on a field nobody has touched yet reads as a failure
  // rather than an instruction.
  const leadsError =
    leadsInput.trim() === '' || leadsTargetValid
      ? null
      : remainingQuota !== null && leadsTarget > remainingQuota
        ? `Il ne vous reste que ${remainingQuota} prospects pour cette période.`
        : 'Indiquez un nombre entier de prospects, au minimum 1.';

  const canSubmit =
    !submitting && keywordInput.trim() !== '' && selectedCommune !== null && leadsTargetValid;

  function closeModal() {
    setModalOpen(false);
    setKeywordInput('');
    setSelectedCommune(null);
    setLeadsInput('');            // [NEW]
    setConfirmation(null);
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!canSubmit || selectedCommune === null) return;
    setSubmitting(true);
    setConfirmation(null);
    try {
      const result = await createCampaign({
        keyword: keywordInput.trim().toLowerCase(),
        codeInsee: selectedCommune.code_insee,
        leadsTarget,                // [NEW]
      });
      if (result.ok) {
        // That's the screen the whole flow exists for -- no need to show
        // a confirmation message first, since the user lands directly on
        // the new campaign's own progress screen.
        router.push(`/app/campagnes/${result.campaignId}`);
        return;
      }
      // Shown verbatim -- the quota/limit messages are written in
      // complete, user-facing French sentences specifically to be
      // displayed as-is, not replaced with a generic failure message.
      setConfirmation(result.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Tooltip.Provider delayDuration={200}>
    <div>
      <div className="page-head">
        <h1>Campagnes</h1>
      </div>

      <div className="campagnes-toolbar">
        <div className="campagnes-toolbar-stats">
          {/* maxActiveCampaigns === null means unlimited (an enterprise
              agreement) -- hide the counter entirely rather than invent a
              number to show against. */}
          {planUsage && planUsage.maxActiveCampaigns !== null && (
            <span className={`campaign-quota${atCampaignLimit ? ' at-limit' : ''}`}>
              <span className="mono-num campaign-quota-num">
                {planUsage.activeCampaigns}/{planUsage.maxActiveCampaigns}
              </span>{' '}
              campagnes actives
            </span>
          )}
          {/* Second placement of the lead quota, beside the campaign
              counter specifically -- an agency with 3 leads left should
              see that before starting a campaign that will find 600
              businesses. The global header (every screen) already shows
              this; this is deliberately in addition to that, not instead
              of it. */}
          {planUsage && <LeadQuotaStat planUsage={planUsage} />}
        </div>
        {atCampaignLimit ? (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              {/* aria-disabled, not disabled: a genuinely disabled button
                  often won't reliably fire hover/focus at all in some
                  browsers, which would silently break the "explain on
                  hover AND focus" requirement. Visually identical, click
                  guarded below instead. */}
              <button
                type="button"
                className="btn btn-primary btn-toolbar-cta is-disabled"
                aria-disabled="true"
                onClick={(e) => e.preventDefault()}
              >
                + Nouvelle campagne
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="info-tooltip-content" sideOffset={6}>
                Limite de {planUsage?.maxActiveCampaigns} campagnes actives atteinte. Terminez ou
                archivez une campagne pour en lancer une nouvelle.
                <Tooltip.Arrow className="info-tooltip-arrow" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-toolbar-cta"
            onClick={() => setModalOpen(true)}
          >
            + Nouvelle campagne
          </button>
        )}
      </div>

      {loading ? (
        <p className="loading-text">Chargement…</p>
      ) : campaigns.length === 0 ? (
        <div className="empty-state campaigns-empty-state">
          <h2>Aucune campagne pour l&rsquo;instant.</h2>
          {planUsage?.tierName === 'free' ? (
            <p>
              Votre recherche gratuite : un métier, une ville,{' '}
              {planUsage.max_leads_per_month ?? 10} prospects.
            </p>
          ) : (
            <p>
              Choisissez un métier et une ville. Nous scannons Google Maps et vous livrons des
              prospects qualifiés en quelques minutes.
            </p>
          )}
          <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
            + Créer ma première campagne
          </button>
        </div>
      ) : (
        <div className="campaign-card-grid">
          {campaigns.map((c) => (
            <Link key={c.id} href={`/app/campagnes/${c.id}`} className="campaign-card-link">
              <div className="campaign-card">
                <div className="campaign-card-top">
                  <span className={statusBadgeClass(c.status)}>{STATUS_LABELS[c.status]}</span>
                  <CampaignMenu />
                </div>
                <div className="campaign-card-keyword">{c.keyword}</div>
                <div className="campaign-card-town">
                  {c.commune.nom} <span className="mono-num">({c.commune.dept_code})</span>
                </div>
                <div className="campaign-card-stats">
                  <span className="mono-num">{c.businesses_found}</span> entreprises trouvées
                  {/* 'completed' shows no percentage -- 100% by definition.
                      'in_progress', 'failed', and 'quota_reached' all
                      stopped somewhere short of the end, and an agency
                      can't tell 5% from 95% without a number. 'paused'
                      isn't named in the spec either way and has no mock
                      example to check against -- flagged, not guessed. */}
                  {(c.status === 'in_progress' ||
                    c.status === 'failed' ||
                    c.status === 'quota_reached') && (
                    <span className="campaign-card-pct mono-num"> · {completionPct(c)}%</span>
                  )}
                </div>
                <div className="campaign-card-date">Créée le {formatDateFR(c.created_at)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title="Nouvelle campagne">
        <form onSubmit={handleSubmit}>
          <div className="filter-group">
            <label htmlFor="new-keyword">Mot-clé</label>
            <input
              id="new-keyword"
              type="text"
              placeholder="ex. plombier"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="filter-group">
            <CommuneAutocomplete
              id="new-commune"
              label="Ville"
              value={selectedCommune}
              onChange={setSelectedCommune}
              placeholder="ex. Lille"
              disabled={submitting}
            />
          </div>

          {/* [NEW] THE ORDER. Until this existed, create_campaign wrote
              the agency's ENTIRE remaining monthly quota into
              campaigns.leads_target and delivery ignored it anyway --
              which is how one campaign delivered 1796 leads and took a
              whole month's allowance.

              type="number" rather than text: it brings up the numeric
              keypad on mobile, which matters more than the desktop
              spinner. onWheel blurs because a number input silently
              changes value when the page is scrolled with the cursor
              over it -- a real data-entry hazard, not a nicety.

              min/max are set for the browser's own validation and for
              assistive tech, but they are NOT the guarantee: the field
              is a courtesy and create_campaign re-checks both bounds
              against the live quota. */}
          <div className="filter-group">
            <label htmlFor="new-leads-target">Nombre de prospects</label>
            <input
              id="new-leads-target"
              type="number"
              inputMode="numeric"
              min={1}
              max={remainingQuota ?? undefined}
              step={1}
              placeholder={remainingQuota === null ? 'ex. 50' : `1 à ${remainingQuota}`}
              value={leadsInput}
              onChange={(e) => setLeadsInput(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              disabled={submitting}
              aria-invalid={leadsError !== null}
              aria-describedby={leadsError !== null ? 'new-leads-target-error' : 'new-leads-target-hint'}
            />
            {leadsError === null ? (
              <p className="settings-hint" id="new-leads-target-hint">
                {remainingQuota === null
                  ? 'Combien de prospects voulez-vous pour cette campagne ?'
                  : `Il vous reste ${remainingQuota} prospects pour cette période.`}
              </p>
            ) : (
              /* role="alert" so a screen reader announces the correction
                 as it is typed, rather than the user discovering it only
                 when the submit button refuses to work. */
              <p className="settings-error-note" id="new-leads-target-error" role="alert">
                {leadsError}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            {submitting ? 'Envoi…' : 'Créer la campagne'}
          </button>

          {confirmation && <p className="campaign-confirmation">{confirmation}</p>}
        </form>
      </Modal>
    </div>
    </Tooltip.Provider>
  );
}
