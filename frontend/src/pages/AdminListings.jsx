/* eslint-disable react-hooks/set-state-in-effect */
// =============================================================
// FILE: frontend/src/pages/AdminListings.jsx
// =============================================================
// Purpose:
//   Moderation queue. Approve, reject, remove, feature,
//   restore. Filter by status and featured flag.
// =============================================================

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { formatPrice } from '../utils/formatPrice';

const STATUS_STYLE = {
  draft: 'bg-zinc-100 text-zinc-700',
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  published: 'bg-emerald-100 text-emerald-800',
  reserved: 'bg-purple-100 text-purple-800',
  sold: 'bg-zinc-900 text-white',
  rejected: 'bg-red-100 text-red-800',
  removed: 'bg-zinc-100 text-zinc-500',
};

const FILTERS = ['pending', 'published', 'rejected', 'removed', 'sold'];

export default function AdminListings() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const featured = params.get('featured') || '';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const query = {};
      if (status) query.status = status;
      if (featured === 'true') query.featured = 'true';
      if (featured === 'false') query.featured = 'false';
      const r = await api.get('/admin/listings', { params: { ...query, limit: 50 } });
      setItems(r.data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [status, featured]);

  async function action(id, act) {
    let reason = '';
    if (act === 'reject' || act === 'remove') {
      reason = prompt(`Reason for ${act}? (internal note)`) || '';
    }
    setBusyId(id);
    try {
      await api.patch(`/admin/listings/${id}/moderate`, { action: act, reason });
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  function setFilter(next) {
    const p = new URLSearchParams(params);
    if (next.status !== undefined) {
      if (next.status) p.set('status', next.status); else p.delete('status');
    }
    if (next.featured !== undefined) {
      if (next.featured) p.set('featured', next.featured); else p.delete('featured');
    }
    setParams(p);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/admin" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider">
        ← Admin
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold text-zinc-900">Listings</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip active={!status && !featured} onClick={() => setFilter({ status: '', featured: '' })}>
          All
        </FilterChip>
        {FILTERS.map((s) => (
          <FilterChip key={s} active={status === s} onClick={() => setFilter({ status: s })}>
            {s}
          </FilterChip>
        ))}
        <FilterChip active={featured === 'true'} onClick={() => setFilter({ status: '', featured: 'true' })}>
          Featured
        </FilterChip>
      </div>

      {loading && <p className="mt-8 text-sm text-zinc-500">Loading…</p>}
      {error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
          Nothing to show.
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Vehicle</th>
                <th className="text-left font-semibold px-5 py-3">Seller</th>
                <th className="text-left font-semibold px-5 py-3">Price</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
                <th className="text-right font-semibold px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((v) => (
                <tr key={v._id} className="border-t border-zinc-100">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {v.featured && (
                        <span className="text-[10px] uppercase tracking-wider font-semibold bg-brand-500 text-white rounded px-1.5 py-0.5">
                          Featured
                        </span>
                      )}
                      <Link to={`/vehicles/${v._id}`} className="font-medium text-zinc-900 hover:text-brand-500">
                        {v.year} {v.make} {v.model}
                      </Link>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {v.images?.length || 0} photos · {v.location?.county || '—'}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {v.seller?.name || '—'}
                  </td>
                  <td className="px-5 py-4 font-semibold text-zinc-900">
                    {formatPrice(v.priceAmount, v.priceCurrency)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold uppercase tracking-wider rounded px-2 py-1 ${STATUS_STYLE[v.status] || 'bg-zinc-100 text-zinc-700'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex flex-wrap items-center gap-3 justify-end">
                      {v.status === 'pending' && (
                        <>
                          <ActionBtn onClick={() => action(v._id, 'approve')} disabled={busyId === v._id} tone="approve">Approve</ActionBtn>
                          <ActionBtn onClick={() => action(v._id, 'reject')} disabled={busyId === v._id} tone="reject">Reject</ActionBtn>
                        </>
                      )}
                      {v.status === 'published' && (
                        <>
                          <ActionBtn onClick={() => action(v._id, v.featured ? 'unfeature' : 'feature')} disabled={busyId === v._id} tone="neutral">
                            {v.featured ? 'Unfeature' : 'Feature'}
                          </ActionBtn>
                          <ActionBtn onClick={() => action(v._id, 'remove')} disabled={busyId === v._id} tone="reject">Remove</ActionBtn>
                        </>
                      )}
                      {v.status === 'removed' && (
                        <ActionBtn onClick={() => action(v._id, 'restore')} disabled={busyId === v._id} tone="approve">Restore</ActionBtn>
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

function FilterChip({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
        active
          ? 'bg-brand-500 text-white'
          : 'border border-zinc-200 text-zinc-700 hover:border-zinc-400'
      }`}
    >
      {children}
    </button>
  );
}

function ActionBtn({ children, onClick, disabled, tone = 'neutral' }) {
  const toneClass =
    tone === 'approve'
      ? 'text-emerald-600 hover:text-emerald-700'
      : tone === 'reject'
      ? 'text-red-600 hover:text-red-700'
      : 'text-brand-500 hover:text-brand-hover';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs font-semibold uppercase tracking-wider disabled:opacity-50 ${toneClass}`}
    >
      {children}
    </button>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/AdminListings.jsx
// =============================================================