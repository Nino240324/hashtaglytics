// app/app/_components/campaign-town-filter.tsx
//
// The town control for the CAMPAIGN LIST FILTER. [2026-10-22]
//
// >>> THIS IS NOT CommuneAutocomplete, AND MUST NOT BECOME IT. <<<
// CommuneAutocomplete searches all 34,746 French communes through the
// search_communes RPC. That is right for CREATING a campaign and wrong
// for filtering one: it would cheerfully offer a town the agency has
// never scanned and hand back an empty list, with nothing on screen
// explaining why. This reads the agency's OWN campaign towns, passed in
// already fetched -- no query of its own, no round trip per keystroke.
// Measured 2026-10-22: 44 distinct towns across 59 campaigns.
//
// It submits code_insee, NEVER the name. 3,774 communes share a slug
// (KU-71), so a name is not an identifier.

'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { CampaignTownOption } from '@/lib/mock-data';

export const TOWN_FILTER_ALL = 'toutes';

// Accent-insensitive on BOTH sides, so "nimes" finds "Nîmes" without the
// user having to produce a circumflex. Same NFD strip the commune slugs
// were generated with.
function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function labelOf(t: CampaignTownOption): string {
  return `${t.nom} (${t.dept_code})`;
}

export function CampaignTownFilter({
  id,
  towns,
  value,
  onChange,
  label = 'Ville',
}: {
  id: string;
  towns: CampaignTownOption[];
  value: string;
  onChange: (codeInsee: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = `${id}-listbox`;

  const selected = towns.find((t) => t.code_insee === value) ?? null;

  // Closed, the field READS AS A VALUE -- the chosen town, or the
  // placeholder. Open, it reads as a search box. Whatever was typed is
  // discarded on close rather than left sitting there looking like a
  // filter that is applied when it is not.
  const shown = open ? query : selected === null ? '' : labelOf(selected);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const q = normalise(query.trim());
  const matches =
    q === ''
      ? towns
      : towns.filter((t) => normalise(t.nom).includes(q) || t.dept_code.startsWith(q));

  // Index 0 is ALWAYS the "Toutes les villes" reset row, so the option
  // list is one longer than `matches` and every index below is offset by
  // it. Keeping the reset inside the listbox means it is reachable by
  // keyboard like every other option, instead of needing a separate
  // control that arrow keys never land on.
  const optionCount = matches.length + 1;

  function commit(index: number) {
    if (index === 0) onChange(TOWN_FILTER_ALL);
    else if (matches[index - 1]) onChange(matches[index - 1].code_insee);
    setOpen(false);
    setQuery('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      return;
    }
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      setOpen(true);
      setActiveIndex(0);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % optionCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + optionCount) % optionCount);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commit(activeIndex);
    }
  }

  return (
    <div className="filter-group town-filter" ref={wrapRef}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${id}-opt-${activeIndex}` : undefined}
        autoComplete="off"
        placeholder="Toutes les villes"
        value={shown}
        onFocus={() => {
          setOpen(true);
          setActiveIndex(0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul className="town-filter-list" id={listId} role="listbox" aria-label={label}>
          {/* onMouseDown, not onClick: the input's blur fires first on a
              click and would close the list before onClick ever ran.
              preventDefault keeps focus on the input. */}
          <li
            id={`${id}-opt-0`}
            role="option"
            aria-selected={value === TOWN_FILTER_ALL}
            className={activeIndex === 0 ? 'active' : undefined}
            onMouseEnter={() => setActiveIndex(0)}
            onMouseDown={(e) => {
              e.preventDefault();
              commit(0);
            }}
          >
            Toutes les villes
          </li>
          {matches.map((t, i) => (
            <li
              key={t.code_insee}
              id={`${id}-opt-${i + 1}`}
              role="option"
              aria-selected={t.code_insee === value}
              className={activeIndex === i + 1 ? 'active' : undefined}
              onMouseEnter={() => setActiveIndex(i + 1)}
              onMouseDown={(e) => {
                e.preventDefault();
                commit(i + 1);
              }}
            >
              {t.nom} <span className="mono-num">({t.dept_code})</span>
            </li>
          ))}
          {matches.length === 0 && (
            <li className="town-filter-empty" role="presentation">
              Aucune ville ne correspond
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
