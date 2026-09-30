// =============================================================
// FILE: frontend/src/pages/MyViewings.jsx
// =============================================================
// Purpose:
//   Buyer's own viewing bookings. Each card links to the receipt.
// =============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Reveal from '../components/Reveal';

const STATUS_LABEL = {
  'pending-payment': 'Pending payment',
  confirmed: 'Confirmed',
  rescheduled: 'Rescheduled',
  completed: 'Completed',
  'cancelled-by-buyer': 'Cancelled',
  'cancelled-by-seller': 'Cancelled by seller',
  'cancelled-by-admin': 'Cancelled',
  'no-show': 'No show',
  'payment-failed': 'Payment failed',
  'payment-refunded': 'Refunded',
};

function statusColor(status) {
  if (status === 'confirmed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'pending-payment') return 'bg-amber-50 text-amber-800 border-amber-200';
  if (status === 'rescheduled') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (String(status).startsWith('cancelled')) return 'bg-zinc-100 text-zinc-600 border-zinc-200';
  return 'bg-zinc-100 text-zinc-600 border-zinc-200';
}

export default function MyViewings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/viewings/mine')
      .then((r) => { if (!cancelled) setItems(r.data.data || []); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Reveal>
        <h1 className="text-4xl text-zinc-900">My viewings</h1>
        <p className="mt-2 text-sm text-zinc-500 uppercase tracking-wide">
          {loading ? 'Loading…' : `${items.length} booking${items.length === 1 ? '' : 's'}`}
        </p>
      </Reveal>

      {error && (
        <div className="mt-8 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="mt-10 rounded-md border border-zinc-200 bg-zinc-50 p-10 text-center">
          <p className="text-sm text-zinc-500">You have no viewings booked yet.</p>
          <Link
            to="/vehicles"
            className="mt-4 inline-block text-sm font-semibold uppercase tracking-wide text-brand-500 hover:text-brand-hover"
          >
            Browse vehicles →
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-8 space-y-4">
          {items.map((v, i) => (
            <Reveal key={v._id} delay={i * 40}>
              <li className="rounded-lg border border-zinc-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs uppercase tracking-widest px-2 py-1 rounded border font-semibold ${statusColor(v.bookingStatus)}`}
                    >
                      {STATUS_LABEL[v.bookingStatus] || v.bookingStatus}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {v.reference}
                    </span>
                  </div>
                  <p className="mt-2 text-base font-semibold text-zinc-900 truncate">
                    {v.vehicle
                      ? `${v.vehicle.year} ${v.vehicle.make} ${v.vehicle.model}`
                      : 'Vehicle'}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {v.date} · {v.startTime}–{v.endTime} · {v.location}
                  </p>
                </div>

                <Link
                  to={`/viewings/${v._id}/receipt`}
                  className="shrink-0 text-sm font-semibold uppercase tracking-wide text-brand-500 hover:text-brand-hover"
                >
                  View receipt →
                </Link>
              </li>
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/MyViewings.jsx
// =============================================================