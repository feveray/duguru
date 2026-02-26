import { useState, useRef, useId } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../services/api";
import type { GeocodingResult } from "../../services/geocodingService";

interface Props {
  onSelect: (place: GeocodingResult) => void;
  error?: string | undefined;
}

/* ─── Fonte de dados do geocodingService (re-exportada no frontend) */

export type { GeocodingResult };

/* ─── Debounce simples ─────────────────────────────────────── */

function useDebounce() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return function debounce(fn: () => void, ms: number) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };
}

/* ─── Componente ────────────────────────────────────────────── */

export function BirthPlaceInput({ onSelect, error }: Props) {
  const { t } = useTranslation("auth");
  const listId = useId();
  const inputId = useId();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const debounce = useDebounce();

  async function fetchResults(q: string) {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get<{ results: GeocodingResult[] }>("/geocoding/search", {
        params: { q },
      });
      setResults(res.data.results.slice(0, 8));
      setOpen(true);
      setActiveIdx(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    debounce(() => { void fetchResults(val); }, 300);
  }

  function handleSelect(place: GeocodingResult) {
    setQuery(place.displayName);
    setResults([]);
    setOpen(false);
    onSelect(place);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      const place = results[activeIdx];
      if (place) handleSelect(place);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }

  const optionIds = results.map((_, i) => `${listId}-option-${i}`);

  return (
    <div className="relative">
      {/* Label */}
      <label
        htmlFor={inputId}
        className="mb-1 block text-sm font-medium text-[var(--color-paragraph)]"
      >
        {t("register.birthPlace")}
        <span className="ml-1 text-[var(--color-error)]" aria-hidden="true">*</span>
      </label>

      {/* Input */}
      <input
        id={inputId}
        type="text"
        className="input-base"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => { setTimeout(() => { setOpen(false); }, 150); }}
        aria-autocomplete="list"
        aria-controls={open ? listId : undefined}
        aria-activedescendant={activeIdx >= 0 ? optionIds[activeIdx] : undefined}
        aria-expanded={open}
        aria-invalid={!!error}
        role="combobox"
        autoComplete="off"
        placeholder={t("register.birthPlacePlaceholder")}
        required
      />

      {/* Loading indicator */}
      {loading && (
        <p className="mt-1 text-xs text-[var(--color-paragraph)]" aria-live="polite">
          {t("common.searching")}
        </p>
      )}

      {/* Error */}
      {error && (
        <p role="alert" className="mt-1 text-xs text-[var(--color-error)]">
          {error}
        </p>
      )}

      {/* Dropdown list */}
      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("register.birthPlaceResults")}
          className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-1 shadow-lg"
        >
          {results.map((place, idx) => (
            <li
              key={`${place.lat}-${place.lon}-${idx}`}
              id={optionIds[idx]}
              role="option"
              aria-selected={idx === activeIdx}
              className={[
                "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
                idx === activeIdx
                  ? "bg-[var(--color-tertiary)] text-[var(--color-headline)]"
                  : "text-[var(--color-paragraph)] hover:bg-[var(--color-tertiary)]",
              ].join(" ")}
              onMouseDown={() => { handleSelect(place); }}
            >
              <span className="w-6 text-base" aria-hidden="true">
                {/* Bandeira com emoji de flag (country code → regional indicator) */}
                {place.countryCode
                  ? String.fromCodePoint(
                      ...[...place.countryCode.toUpperCase()].map(
                        (c) => 0x1f1e0 - 65 + c.charCodeAt(0),
                      ),
                    )
                  : "🌍"}
              </span>
              <span className="flex-1 truncate">{place.displayName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
