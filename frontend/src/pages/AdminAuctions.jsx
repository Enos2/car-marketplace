/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
// =============================================================
// FILE: frontend/src/pages/AdminAuctions.jsx
// =============================================================

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { formatPrice } from '../utils/formatPrice';

const FILTERS = ['pending', 'live', 'ended', 'settled', 'rejected', 'cancelled'];

const STATUS_STYLE = {
  draft: 'bg-zinc-100 text-zinc-700',
  pending: 'bg-amber-100 text-amber-800',
  live: 'bg-emerald-100 text-emerald-800',
  ended: 'bg-blue-100 text-blue-800',
  settled: 'bg-zinc-900 text-white',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-zinc-100 text-zinc-500',
};

export default function AdminAuctions() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = { limit: 50 };
      if (status) q.status = status;
      const r = await api.get('/admin/auctions', { params: q });
      setItems(r.data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);

  function setFilter(s) {
    const p = new URLSearchParams(params);
    if (s) p.set('status', s); else p.delete('status');
    setParams(p);
  }

  async function action(id, act) {
    let reason = '';
    if (act === 'reject' || act === 'cancel') {
      reason = prompt(`Reason for ${act}?`) || '';
    }
    setBusyId(id);
    try {
      await api.patch(`/admin/auctions/${id}/moderate`, { action: act, reason });
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/admin" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider">
        ← Admin
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold text-zinc-900">Auction moderation</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <Chip active={!status} onClick={() => setFilter('')}>All</Chip>
        {FILTERS.map((s) => (
          <Chip key={s} active={status === s} onClick={() => setFilter(s)}>{s}</Chip>
        ))}
      </div>

      {loading && <p className="mt-8 text-sm text-zinc-500">Loading…</p>}
      {error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}
      {!loading && items.length === 0 && (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
          Nothing to review.
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Auction</th>
                <th className="text-left font-semibold px-5 py-3">Seller</th>
                <th className="text-left font-semibold px-5 py-3">Start / End</th>
                <th className="text-left font-semibold px-5 py-3">Current</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
                <th className="text-right font-semibold px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a._id} className="border-t border-zinc-100">
                  <td className="px-5 py-4">
                    <p className="font-medium text-zinc-900">{a.title}</p>
                    <p className="text-xs text-zinc-500">
                      {a.vehicle ? `${a.vehicle.year} ${a.vehicle.make} ${a.vehicle.model}` : '—'}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-zinc-600">{a.seller?.name || '—'}</td>
                  <td className="px-5 py-4 text-xs text-zinc-500">
                    {new Date(a.startsAt).toLocaleString()}<br />
                    {new Date(a.endsAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 font-semibold text-zinc-900">
                    {formatPrice(a.currentBidMinor || a.startingBidMinor, a.currency)}
                    <span className="block text-xs text-zinc-400 font-normal">
                      {a.bidCount} bid{a.bidCount === 1 ? '' : 's'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold uppercase tracking-wider rounded px-2 py-1 ${STATUS_STYLE[a.status] || ''}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex flex-wrap gap-3 justify-end">
                      {a.status === 'pending' && (
                        <>
                          <Btn onClick={() => action(a._id, 'approve')} disabled={busyId === a._id} tone="approve">Approve</Btn>
                          <Btn onClick={() => action(a._id, 'reject')} disabled={busyId === a._id} tone="reject">Reject</Btn>
                        </>
                      )}
                      {a.status === 'live' && (
                        <Btn onClick={() => action(a._id, 'cancel')} disabled={busyId === a._id} tone="reject">Cancel</Btn>
                      )}
                      {a.status === 'ended' && (
                        <Btn onClick={() => action(a._id, 'settle')} disabled={busyId === a._id} tone="approve">Settle</Btn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Chip({ children, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
        active ? 'bg-brand-500 text-white' : 'border border-zinc-200 text-zinc-700 hover:border-zinc-400'
      }`}>
      {children}
    </button>
  );
}

function Btn({ children, onClick, disabled, tone = 'neutral' }) {
  const cls = tone === 'approve' ? 'text-emerald-600 hover:text-emerald-700'
    : tone === 'reject' ? 'text-red-600 hover:text-red-700'
    : 'text-brand-500 hover:text-brand-hover';
  return (
    <button onClick={onClick} disabled={disabled}
      className={`text-xs font-semibold uppercase tracking-wider disabled:opacity-50 ${cls}`}>
      {children}
    </button>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/AdminAuctions.jsx
// =============================================================