// =============================================================
// FILE: frontend/src/pages/SellerViewings.jsx
// =============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function SellerViewings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/sellers/me/viewings', { params: { limit: 50 } })
      .then((r) => { if (!cancelled) setItems(r.data.data || []); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link to="/seller" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold text-zinc-900">Viewings</h1>
      <p className="mt-1 text-sm text-zinc-500">Bookings for your vehicles.</p>

      {loading && <p className="mt-8 text-sm text-zinc-500">Loading…</p>}
      {error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}
      {!loading && items.length === 0 && (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
          No viewings booked yet.
        </div>
      )}

      <ul className="mt-8 space-y-3">
        {items.map((v) => (
          <li key={v._id} className="rounded-xl border border-zinc-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-mono text-zinc-400">{v.reference}</p>
              <p className="mt-1 font-semibold text-zinc-900">
                {v.vehicle ? `${v.vehicle.year} ${v.vehicle.make} ${v.vehicle.model}` : 'Vehicle'}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {v.date} · {v.startTime}–{v.endTime} · {v.location}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {v.buyerContact?.name} · {v.buyerContact?.email}
              </p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider rounded px-2 py-1 bg-zinc-100 text-zinc-700 whitespace-nowrap">
              {v.bookingStatus}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/SellerViewings.jsx
// =============================================================