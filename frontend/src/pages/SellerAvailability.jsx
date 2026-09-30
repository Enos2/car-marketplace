// =============================================================
// FILE: frontend/src/pages/SellerAvailability.jsx
// =============================================================
// Purpose:
//   Configure viewing availability.
// =============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const DAYS = [
  { n: 0, label: 'Sun' },
  { n: 1, label: 'Mon' },
  { n: 2, label: 'Tue' },
  { n: 3, label: 'Wed' },
  { n: 4, label: 'Thu' },
  { n: 5, label: 'Fri' },
  { n: 6, label: 'Sat' },
];

export default function SellerAvailability() {
  const [days, setDays] = useState([1, 2, 3, 4, 5]);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [location, setLocation] = useState('');
  const [feeMajor, setFeeMajor] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/sellers/me/availability').then((r) => {
      const a = r.data.data;
      if (!a) return;
      if (a.days) setDays(a.days);
      if (a.windows?.[0]) { setStart(a.windows[0].start); setEnd(a.windows[0].end); }
      if (a.slotMinutes) setSlotMinutes(a.slotMinutes);
      if (a.location) setLocation(a.location);
      if (a.feeMinor) setFeeMajor(a.feeMinor / 100);
    }).catch(() => {});
  }, []);

  const toggleDay = (n) => {
    setDays((d) => d.includes(n) ? d.filter((x) => x !== n) : [...d, n].sort());
  };

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.patch('/sellers/me/availability', {
        days,
        windows: [{ start, end }],
        slotMinutes: Number(slotMinutes),
        location,
        feeMinor: Math.round(Number(feeMajor) * 100),
        feeCurrency: 'KES',
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link to="/seller" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold text-zinc-900">Viewing availability</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Buyers can only book viewings during the days and hours you set here.
      </p>

      <form onSubmit={handleSave} className="mt-8 space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-3">
            Days
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(({ n, label }) => {
              const active = days.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggleDay(n)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    active ? 'bg-brand-500 text-white' : 'border border-zinc-200 text-zinc-700 hover:border-zinc-400'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">Start</label>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">End</label>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">Slot (min)</label>
            <input type="number" min="15" max="480" value={slotMinutes} onChange={(e) => setSlotMinutes(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
            Viewing location
          </label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Demo Motors, Westlands"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
            Viewing fee (KES, 0 for free)
          </label>
          <input type="number" min="0" value={feeMajor} onChange={(e) => setFeeMajor(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="rounded-full bg-brand-500 text-white px-6 py-3 text-sm font-semibold hover:bg-brand-hover disabled:opacity-50">
            {saving ? 'Saving…' : 'Save availability'}
          </button>
          {saved && <span className="text-sm text-emerald-600 font-medium">Saved</span>}
        </div>
      </form>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/SellerAvailability.jsx
// =============================================================