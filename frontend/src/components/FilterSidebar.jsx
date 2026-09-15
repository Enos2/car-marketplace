// =============================================================
// FILE: frontend/src/components/FilterSidebar.jsx
// =============================================================

import { useEffect, useState } from 'react';
import api from '../services/api';

export default function FilterSidebar({ filters, onChange, onReset }) {
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/meta')
      .then((r) => { if (!cancelled) setMeta(r.data.data); })
      .catch(() => { if (!cancelled) setMeta({}); });
    return () => { cancelled = true; };
  }, []);

  const set = (key, value) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  if (!meta) {
    return (
      <aside className="w-full lg:w-64 shrink-0">
        <div className="text-sm text-neutral-500">Loading filters…</div>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm uppercase tracking-wide text-neutral-400">Filters</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-neutral-500 hover:text-neutral-200"
        >
          Reset
        </button>
      </div>

      <div className="space-y-5">
        <Select label="Make" value={filters.make || ''} onChange={(v) => set('make', v)} options={meta.makes || []} />
        <Select label="Body type" value={filters.bodyType || ''} onChange={(v) => set('bodyType', v)} options={(meta.bodyTypes || []).map((v) => ({ value: v, label: cap(v) }))} />
        <Select label="Fuel" value={filters.fuelType || ''} onChange={(v) => set('fuelType', v)} options={(meta.fuelTypes || []).map((v) => ({ value: v, label: cap(v) }))} />
        <Select label="Transmission" value={filters.transmission || ''} onChange={(v) => set('transmission', v)} options={(meta.transmissions || []).map((v) => ({ value: v, label: cap(v) }))} />
        <Select label="Condition" value={filters.condition || ''} onChange={(v) => set('condition', v)} options={(meta.conditions || []).map((v) => ({ value: v, label: cap(v) }))} />
        <Select label="County" value={filters.county || ''} onChange={(v) => set('county', v)} options={meta.counties || []} />

        <div>
          <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-1.5">Year range</label>
          <div className="flex gap-2">
            <input type="number" placeholder="Min" value={filters.minYear || ''} onChange={(e) => set('minYear', e.target.value)} className="w-full rounded border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-sm focus:outline-none focus:border-neutral-600" />
            <input type="number" placeholder="Max" value={filters.maxYear || ''} onChange={(e) => set('maxYear', e.target.value)} className="w-full rounded border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-sm focus:outline-none focus:border-neutral-600" />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-1.5">Price (KES major units)</label>
          <div className="flex gap-2">
            <input type="number" placeholder="Min" value={filters.minPriceMajor || ''} onChange={(e) => set('minPriceMajor', e.target.value)} className="w-full rounded border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-sm focus:outline-none focus:border-neutral-600" />
            <input type="number" placeholder="Max" value={filters.maxPriceMajor || ''} onChange={(e) => set('maxPriceMajor', e.target.value)} className="w-full rounded border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-sm focus:outline-none focus:border-neutral-600" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function Select({ label, value, onChange, options }) {
  const normalized = (options || []).map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o
  );
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-sm focus:outline-none focus:border-neutral-600">
        <option value="">Any</option>
        {normalized.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </div>
  );
}

function cap(s) {
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

// =============================================================
// END OF FILE: frontend/src/components/FilterSidebar.jsx
// =============================================================