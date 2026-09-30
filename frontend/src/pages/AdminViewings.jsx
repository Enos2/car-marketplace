/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
// =============================================================
// FILE: frontend/src/pages/AdminViewings.jsx
// =============================================================
// Purpose:
//   The receipt-review queue from the addendum. Filter by
//   receipt review status. Mark viewed. Reschedule.
// =============================================================

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const RECEIPT_FILTERS = ['pending', 'viewed', 'postponed', 'rescheduled'];

const RECEIPT_BADGE = {
  pending: 'bg-amber-100 text-amber-800',
  viewed: 'bg-emerald-100 text-emerald-800',
  postponed: 'bg-orange-100 text-orange-800',
  rescheduled: 'bg-blue-100 text-blue-800',
};

export default function AdminViewings() {
  const [params, setParams] = useSearchParams();
  const receiptStatus = params.get('receiptStatus') || '';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = { limit: 50 };
      if (receiptStatus) q.receiptStatus = receiptStatus;
      const r = await api.get('/admin/viewings', { params: q });
      setItems(r.data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [receiptStatus]);

  function setFilter(s) {
    const p = new URLSearchParams(params);
    if (s) p.set('receiptStatus', s); else p.delete('receiptStatus');
    setParams(p);
  }

  async function markViewed(id) {
    try {
      await api.post(`/admin/viewings/${id}/receipt/mark-viewed`);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/admin" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider">
        ← Admin
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold text-zinc-900">Viewings</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Receipt review queue. Statuses update automatically after 24h.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Chip active={!receiptStatus} onClick={() => setFilter('')}>All</Chip>
        {RECEIPT_FILTERS.map((s) => (
          <Chip key={s} active={receiptStatus === s} onClick={() => setFilter(s)}>
            {s}
          </Chip>
        ))}
      </div>

      {loading && <p className="mt-8 text-sm text-zinc-500">Loading…</p>}
      {error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      {!loading && items.length === 0 && (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
          No viewings in this queue.
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Reference</th>
                <th className="text-left font-semibold px-5 py-3">Vehicle</th>
                <th className="text-left font-semibold px-5 py-3">Buyer</th>
                <th className="text-left font-semibold px-5 py-3">Appointment</th>
                <th className="text-left font-semibold px-5 py-3">Receipt status</th>
                <th className="text-right font-semibold px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((v) => {
                const rs = v.receipt?.reviewStatus || 'pending';
                return (
                  <tr key={v._id} className="border-t border-zinc-100">
                    <td className="px-5 py-4 font-mono text-xs text-zinc-500">{v.reference}</td>
                    <td className="px-5 py-4 text-zinc-900">
                      {v.vehicle ? `${v.vehicle.year} ${v.vehicle.make} ${v.vehicle.model}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {v.buyer?.name || v.buyerContact?.name || '—'}
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {v.date} · {v.startTime}–{v.endTime}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold uppercase tracking-wider rounded px-2 py-1 ${RECEIPT_BADGE[rs]}`}>
                        {rs}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {rs !== 'viewed' && (
                        <button
                          onClick={() => markViewed(v._id)}
                          className="text-xs font-semibold text-brand-500 hover:text-brand-hover uppercase tracking-wider"
                        >
                          Mark viewed
                        </button>
                      )}
                      {rs === 'viewed' && (
                        <span className="text-xs text-zinc-400">Reviewed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Chip({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
        active ? 'bg-brand-500 text-white' : 'border border-zinc-200 text-zinc-700 hover:border-zinc-400'
      }`}
    >
      {children}
    </button>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/AdminViewings.jsx
// =============================================================