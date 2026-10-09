// =============================================================
// FILE: frontend/src/pages/NewAuction.jsx
// =============================================================
// Purpose:
//   Seller submits one of their published vehicles for auction.
// =============================================================

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatPrice } from '../utils/formatPrice';

export default function NewAuction() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    vehicleId: '',
    title: '',
    description: '',
    currency: 'KES',
    startingBidMajor: '',
    reserveMajor: '',
    minIncrementMajor: '10000',
    startsAt: '',
    endsAt: '',
  });

  useEffect(() => {
    // load seller's published vehicles
    api
      .get('/sellers/me/stats')
      .then((r) => {
        const list = r.data.data.topListings || [];
        setVehicles(list.filter((v) => v.status === 'published'));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingVehicles(false));
  }, []);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        vehicleId: form.vehicleId,
        title: form.title.trim(),
        description: form.description.trim(),
        currency: form.currency,
        startingBidMinor: Math.round(Number(form.startingBidMajor) * 100),
        reserveMinor: form.reserveMajor ? Math.round(Number(form.reserveMajor) * 100) : undefined,
        minIncrementMinor: Math.round(Number(form.minIncrementMajor) * 100),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      };
      await api.post('/auctions', payload);
      navigate('/seller/auctions');
    } catch (err) {
      setError(err.message || 'Could not create auction.');
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-brand-500';
  const labelClass =
    'block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2';

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/seller/auctions" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider">
        ← My auctions
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold text-zinc-900">Submit a vehicle for auction</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Your submission will be reviewed before it goes live.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className={labelClass}>Vehicle</label>
          {loadingVehicles ? (
            <p className="text-sm text-zinc-500">Loading your vehicles…</p>
          ) : vehicles.length === 0 ? (
            <p className="text-sm text-zinc-500">
              You have no published vehicles.{' '}
              <Link to="/seller/listings/new" className="font-semibold text-brand-500">
                Create one first
              </Link>
              .
            </p>
          ) : (
            <select value={form.vehicleId} onChange={update('vehicleId')} required className={fieldClass}>
              <option value="">Select a vehicle…</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.year} {v.make} {v.model} — {formatPrice(v.priceAmount, v.priceCurrency)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className={labelClass}>Auction title</label>
          <input type="text" required value={form.title} onChange={update('title')} className={fieldClass} />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea rows={4} value={form.description} onChange={update('description')} className={fieldClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Currency</label>
            <select value={form.currency} onChange={update('currency')} className={fieldClass}>
              <option value="KES">KES</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Starting bid</label>
            <input type="number" required value={form.startingBidMajor} onChange={update('startingBidMajor')} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Reserve price (hidden)</label>
            <input type="number" value={form.reserveMajor} onChange={update('reserveMajor')} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Minimum increment</label>
            <input type="number" required value={form.minIncrementMajor} onChange={update('minIncrementMajor')} className={fieldClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Starts at</label>
            <input type="datetime-local" required value={form.startsAt} onChange={update('startsAt')} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Ends at</label>
            <input type="datetime-local" required value={form.endsAt} onChange={update('endsAt')} className={fieldClass} />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || vehicles.length === 0}
            className="rounded-full bg-brand-500 text-white px-6 py-3 text-sm font-semibold hover:bg-brand-hover disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit for review'}
          </button>
          <Link to="/seller/auctions" className="px-6 py-3 text-sm font-semibold text-zinc-600">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/NewAuction.jsx
// =============================================================