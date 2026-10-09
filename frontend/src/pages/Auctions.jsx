/* eslint-disable react-hooks/purity */
/* eslint-disable react-refresh/only-export-components */
// =============================================================
// FILE: frontend/src/pages/Auctions.jsx
// =============================================================
// Purpose:
//   Public grid of live auctions. Each card links to the detail
//   page. Live countdown updates every second.
// =============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import Reveal from '../components/Reveal';

export default function Auctions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    api
      .get('/auctions', { params: { limit: 24, status: 'live' } })
      .then((r) => { if (!cancelled) setItems(r.data.data || []); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // tick once a second for countdowns
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Reveal>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-zinc-900">Live auctions</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Bid on vehicles from verified sellers.
            </p>
          </div>
          <Link
            to="/seller/auctions/new"
            className="rounded-full bg-brand-500 text-white px-6 py-3 text-sm font-semibold hover:bg-brand-hover transition-colors"
          >
            Submit a vehicle
          </Link>
        </div>
      </Reveal>

      {error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && <p className="mt-8 text-sm text-zinc-500">Loading auctions…</p>}

      {!loading && items.length === 0 && (
        <div className="mt-10 rounded-lg border border-zinc-200 bg-white p-12 text-center">
          <p className="text-sm text-zinc-500">No live auctions right now.</p>
          <Link
            to="/vehicles"
            className="mt-4 inline-block text-sm font-semibold text-brand-500 hover:text-brand-hover"
          >
            Browse vehicles →
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a, i) => (
            <Reveal key={a._id} delay={(i % 3) * 60}>
              <AuctionCard auction={a} now={now} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

function AuctionCard({ auction, now }) {
  const v = auction.vehicle || {};
  const primary = v.images?.find((img) => img.isPrimary) || v.images?.[0];
  const ended = new Date(auction.endsAt).getTime() <= now;

  return (
    <Link
      to={`/auctions/${auction._id}`}
      className="group block bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-brand-500 hover:shadow-[0_12px_32px_-16px_rgba(220,30,30,0.35)] transition-all"
    >
      <div className="relative aspect-4/3 bg-zinc-100 overflow-hidden">
        {primary ? (
          <img src={primary.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 px-6 text-center">
            <span className="text-2xl font-extrabold text-zinc-500">{v.make}</span>
            <span className="text-sm text-zinc-500 mt-1">{v.model}</span>
          </div>
        )}

        <span className={`absolute top-3 left-3 text-[10px] uppercase tracking-widest font-bold rounded px-2 py-1 ${
          ended ? 'bg-zinc-900 text-white' : 'bg-brand-500 text-white'
        }`}>
          {ended ? 'Ended' : 'Live'}
        </span>

        <span className="absolute top-3 right-3 text-[11px] font-semibold bg-zinc-900/80 text-white rounded px-2 py-1">
          {ended ? 'Closed' : formatCountdown(auction.endsAt, now)}
        </span>
      </div>

      <div className="p-5">
        <h3 className="text-base font-bold text-zinc-900 truncate">
          {v.year} {v.make} {v.model}
        </h3>
        <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">
          {auction.bidCount} bid{auction.bidCount === 1 ? '' : 's'}
        </p>
        <p className="mt-3 text-2xl font-extrabold text-brand-500">
          {formatPrice(auction.currentBidMinor || auction.startingBidMinor, auction.currency)}
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          {auction.currentBidMinor ? 'Current bid' : 'Starting bid'}
        </p>
      </div>
    </Link>
  );
}

export function formatCountdown(endsAt, now) {
  const diff = new Date(endsAt).getTime() - now;
  if (diff <= 0) return '00:00:00';
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// =============================================================
// END OF FILE: frontend/src/pages/Auctions.jsx
// =============================================================