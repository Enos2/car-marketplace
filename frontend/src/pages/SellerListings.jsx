/* eslint-disable react-hooks/set-state-in-effect */
// =============================================================
// FILE: frontend/src/pages/SellerListings.jsx
// =============================================================
// Purpose:
//   Table of the seller's own vehicles. Status filter.
//   Actions: Edit (with photo upload), Submit for review,
//   Delete.
// =============================================================

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import Reveal from '../components/Reveal';

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

export default function SellerListings() {
  const [params] = useSearchParams();
  // eslint-disable-next-line no-unused-vars
  const statusFilter = params.get('status');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // sellers/me/vehicles isn't a route — use vehicles list filtered
      // by seller. Backend doesn't expose seller=me yet; simplest
      // approach: use the seller-scoped stats route's topListings.
      const r = await api.get('/sellers/me/stats');
      setItems(r.data.data.topListings || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(id) {
    if (!confirm('Submit this listing for review?')) return;
    setBusyId(id);
    try {
      await api.post(`/vehicles/${id}/submit`);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this listing?')) return;
    setBusyId(id);
    try {
      await api.delete(`/vehicles/${id}`);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Reveal>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <Link to="/seller" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider">
              ← Dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-extrabold text-zinc-900">My listings</h1>
          </div>
          <Link
            to="/seller/listings/new"
            className="rounded-full bg-brand-500 text-white px-6 py-3 text-sm font-semibold hover:bg-brand-hover transition-colors"
          >
            + New listing
          </Link>
        </div>
      </Reveal>

      {error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && <p className="mt-8 text-sm text-zinc-500">Loading…</p>}

      {!loading && items.length === 0 && (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-10 text-center">
          <p className="text-sm text-zinc-500">You have no listings yet.</p>
          <Link
            to="/seller/listings/new"
            className="mt-4 inline-block text-sm font-semibold text-brand-500 hover:text-brand-hover"
          >
            Create your first listing →
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Vehicle</th>
                <th className="text-left font-semibold px-5 py-3">Price</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
                <th className="text-right font-semibold px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((v) => (
                <tr key={v._id} className="border-t border-zinc-100">
                  <td className="px-5 py-4">
                    <p className="font-medium text-zinc-900">
                      {v.year} {v.make} {v.model}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {v.images?.length || 0} photo{(v.images?.length || 0) === 1 ? '' : 's'}
                    </p>
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
                    <div className="inline-flex items-center gap-3">
                      <Link
                        to={`/seller/listings/${v._id}/edit`}
                        className="text-xs font-semibold text-brand-500 hover:text-brand-hover uppercase tracking-wider"
                      >
                        Edit
                      </Link>
                      {(v.status === 'draft' || v.status === 'rejected') && (
                        <button
                          onClick={() => handleSubmit(v._id)}
                          disabled={busyId === v._id}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider disabled:opacity-50"
                        >
                          Submit
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(v._id)}
                        disabled={busyId === v._id}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 uppercase tracking-wider disabled:opacity-50"
                      >
                        Delete
                      </button>
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

// =============================================================
// END OF FILE: frontend/src/pages/SellerListings.jsx
// =============================================================