// src/ui/AddressAutocomplete.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n.js";
import "./AddressAutocomplete.css";

type Result = {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
};

export type AddressValue = {
  label: string;
  lat: number;
  lon: number;
};

export default function AddressAutocomplete({
  value,
  onSelect,
  placeholder,
}: {
  value?: AddressValue | null;
  onSelect: (v: AddressValue) => void;
  placeholder?: string;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState(value?.label ?? "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // basic debounce
  const query = useDebounced(input.trim(), 350);

  // Close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }
    // cancel previous
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // Nominatim search (bounded to Belgrade; country RS)
    // NOTE: Please keep a nice User-Agent per Nominatim policy.
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      addressdetails: "1",
      limit: "8",
      countrycodes: "rs",
      // Rough Belgrade bbox: minLon,minLat,maxLon,maxLat
      // (tweak as you like)
      viewbox: "20.20,44.68,20.65,44.95",
      bounded: "1",
    });

    setLoading(true);
    fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      signal: ctrl.signal,
      headers: {
        "Accept": "application/json",
        // put your project/site as user agent
        "User-Agent": "H2O-Monitor/1.0 (student project)",
        "Referrer-Policy": "no-referrer-when-downgrade",
      },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Search failed");
        const data = (await r.json()) as Result[];
        setResults(data);
        setActive(0);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setResults([]);
      })
      .finally(() => setLoading(false));
  }, [query]);

  function choose(r: Result) {
    const val: AddressValue = {
      label: r.display_name,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
    };
    setInput(val.label);
    setOpen(false);
    onSelect(val);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active];
      if (r) choose(r);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // open dropdown when typing
  useEffect(() => {
    if (input.trim().length > 0) setOpen(true);
  }, [input]);

  return (
    <div className="addr" ref={boxRef}>
      <input
        className="input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => input.trim() && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? t("address_placeholder")}
        autoComplete="off"
        spellCheck={false}
      />

      {open && (
        <div className="addr__dropdown" role="listbox">
          {loading && <div className="addr__hint">{t("searching")}</div>}

          {!loading && results.length === 0 && query && (
            <div className="addr__hint">{t("no_results")}</div>
          )}

          {!loading &&
            results.map((r, i) => (
              <button
                type="button"
                key={r.place_id}
                role="option"
                aria-selected={i === active}
                className={`addr__item ${i === active ? "is-active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(r)}
                title={r.display_name}
              >
                {r.display_name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function useDebounced<T>(val: T, ms: number) {
  const [v, setV] = useState(val);
  useEffect(() => {
    const id = setTimeout(() => setV(val), ms);
    return () => clearTimeout(id);
  }, [val, ms]);
  return v;
}
