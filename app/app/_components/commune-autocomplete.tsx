// app/app/_components/commune-autocomplete.tsx
//
// Reusable across both consumers named in the brief: the campaign
// creation modal (§5.2) and the public free-scan popup (§9, "same
// autocomplete as 5.2"). Submits code_insee, never the name — slug is NOT
// unique (3,774 communes share a name; 'Sainte-Colombe' exists six times
// in this mock alone), so the name can never identify a town on its own.
//
// Dropdown rendered via Radix Popover.Portal so it escapes the modal's
// overflow:auto rather than getting clipped by it — Radix Popover was
// confirmed already a project dependency.

'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { searchCommunes, type Commune } from '@/lib/mock-data';

export type CommuneAutocompleteProps = {
  id: string;
  label: string;
  value: Commune | null;
  onChange: (commune: Commune | null) => void;
  placeholder?: string;
  disabled?: boolean;
};

function formatCommune(c: Commune): string {
  return `${c.nom} (${c.dept_code})`;
}

const frCount = new Intl.NumberFormat('fr-FR');

export function CommuneAutocomplete({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: CommuneAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value ? formatCommune(value) : '');
  const [results, setResults] = useState<Commune[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the displayed text in sync when the selected value changes
  // externally (e.g. the form resets after submit).
  useEffect(() => {
    setInputValue(value ? formatCommune(value) : '');
  }, [value]);

  // Cancel a pending debounced search on unmount -- closing the modal
  // unmounts this component, and a stray timeout firing afterward would
  // call setState on an unmounted component.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleInputChange(next: string) {
    setInputValue(next);
    // Typing invalidates whatever was selected — the caller must not
    // treat stale text as a valid commune until a real one is re-picked.
    if (value !== null) onChange(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { results, totalMatches } = await searchCommunes(next);
      setResults(results);
      setTotalMatches(totalMatches);
      setHighlighted(0);
      setIsOpen(results.length > 0);
    }, 200);
  }

  function selectCommune(c: Commune) {
    onChange(c);
    setInputValue(formatCommune(c));
    setIsOpen(false);
  }

  function handleBlurCleanup() {
    // If the field was left with typed text that was never actually
    // selected, don't leave text on screen implying a commune is chosen
    // when none is.
    if (value === null && inputValue !== '') {
      setInputValue('');
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectCommune(results[highlighted]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  const listboxId = `${id}-listbox`;
  const truncated = totalMatches > results.length;

  return (
    <div className="commune-autocomplete">
      <label htmlFor={id}>{label}</label>
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Anchor asChild>
          <input
            id={id}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={isOpen ? `${id}-option-${highlighted}` : undefined}
            autoComplete="off"
            disabled={disabled}
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            onBlur={handleBlurCleanup}
            onKeyDown={handleKeyDown}
          />
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content
            className="commune-autocomplete-popover"
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <ul id={listboxId} role="listbox" className="commune-autocomplete-list">
              {results.map((c, i) => (
                <li
                  key={c.code_insee}
                  id={`${id}-option-${i}`}
                  role="option"
                  aria-selected={i === highlighted}
                  className={i === highlighted ? 'highlighted' : undefined}
                  // mousedown, not click -- fires before the input's onBlur,
                  // so the selection isn't wiped by handleBlurCleanup first.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectCommune(c);
                  }}
                  onMouseEnter={() => setHighlighted(i)}
                >
                  <span className="commune-name">{c.nom}</span>
                  <span className="commune-dept">({c.dept_code})</span>
                  <span className="commune-region">{c.region_name}</span>
                </li>
              ))}
            </ul>
            {truncated && (
              <p className="commune-autocomplete-truncated">
                {frCount.format(totalMatches)} communes correspondent — précisez votre recherche
              </p>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
