/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
// =============================================================
// FILE: frontend/src/pages/AuctionDetail.jsx
// =============================================================
// Purpose:
//   Full auction page. Live countdown, current bid, bid history,
//   bid form. Uses POST /auctions/:id/bids.
// =============================================================

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { useAuth } from '../context/AuthContext';
import { formatCountdown } from './Auctions';
import Reveal from '../components/Reveal';

export default function AuctionDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [bidError, setBidError] = useState(null);
  const [bidSuccess, setBidSuccess] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get(`/auctions/${id}`);
      setAuction(r.data.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const minBid = auction
    ? auction.currentBidMinor > 0
      ? auction.currentBidMinor + auction.minIncrementMinor
      : auction.startingBidMinor
    : 0;

  async function handleBid(e) {
    e.preventDefault();
    setBidError(null);
    setBidSuccess(null);
    setBidding(true);
    try {
      await api.post(`/auctions/${id}/bids`, { amountMinor: Number(bidAmount) });
      setBidSuccess('Bid placed');
      setBidAmount('');
      await load();
    } catch (err) {
      setBidError(err.message || 'Bid failed');
    } finally {
      setBidding(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-zinc-500">Loading…</div>;
  if (error) return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
    </div>
  );
  if (!auction) return null;

  const v = auction.vehicle || {};
  const ended = new Date(auction.endsAt).getTime() <= now;
  const isLive = auction.status === 'live' && !ended;
  const isSeller = user && auction.seller && String(user._id) === String(auction.seller._id);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/auctions" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider">
        ← Back to auctions
      </Link>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-10">
        {/* Left: photos + description */}
        <div>
          <Reveal>
            <div className="aspect-4/3 rounded-2xl border border-zinc-200 bg-zinc-100 overflow-hidden">
              {v.images?.[0] ? (
                <img src={v.images[0].url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400">
                  <span className="text-3xl font-extrabold text-zinc-500">{v.make}</span>
                  <span className="text-sm mt-1">{v.model}</span>
                </div>
              )}
            </div>
          </Reveal>

          {v.images?.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {v.images.slice(0, 5).map((img, i) => (
                <div key={img._id || i} className="aspect-square rounded border border-zinc-200 overflow-hidden">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <section className="mt-10">
            <h2 className="text-2xl font-extrabold text-zinc-900">Lot details</h2>
            <p className="mt-4 text-sm text-zinc-700 whitespace-pre-line">
              {auction.description || 'No additional details.'}
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <Spec label="Make" value={v.make} />
              <Spec label="Model" value={v.model} />
              <Spec label="Year" value={v.year} />
              <Spec label="Mileage" value={`${v.mileage?.toLocaleString('en-KE')} ${v.mileageUnit}`} />
              <Spec label="Body type" value={v.bodyType} />
              <Spec label="Fuel" value={v.fuelType} />
            </dl>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-extrabold text-zinc-900">Bid history</h2>
            {auction.bids?.length === 0 && (
              <p className="mt-4 text-sm text-zinc-500">No bids yet.</p>
            )}
            {auction.bids?.length > 0 && (
              <ul className="mt-4 space-y-2">
                {auction.bids.map((b, i) => (
                  <li key={b._id} className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                    i === 0 ? 'border-brand-500 bg-brand-50' : 'border-zinc-200 bg-white'
                  }`}>
                    <span className="text-sm text-zinc-700">{b.bidderName}</span>
                    <span className="text-sm font-bold text-zinc-900">
                      {formatPrice(b.amountMinor, auction.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right: bid box */}
        <aside className="lg:sticky lg:top-24 self-start">
          <Reveal delay={80}>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_8px_28px_-12px_rgba(0,0,0,0.15)]">
              <div className={`inline-block text-[10px] uppercase tracking-widest font-bold rounded px-2 py-1 ${
                isLive ? 'bg-brand-500 text-white' : 'bg-zinc-900 text-white'
              }`}>
                {isLive ? 'Live' : 'Ended'}
              </div>

              <h1 className="mt-3 text-xl font-bold text-zinc-900 leading-tight">
                {auction.title}
              </h1>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  {auction.currentBidMinor ? 'Current bid' : 'Starting bid'}
                </p>
                <p className="mt-1 text-4xl font-extrabold text-zinc-900">
                  {formatPrice(auction.currentBidMinor || auction.startingBidMinor, auction.currency)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {auction.bidCount} bid{auction.bidCount === 1 ? '' : 's'}
                </p>
              </div>

              <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-center">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                  {ended ? 'Closed' : 'Closes in'}
                </p>
                <p className="mt-1 text-2xl font-extrabold text-zinc-900 tabular-nums">
                  {formatCountdown(auction.endsAt, now)}
                </p>
              </div>

              {isLive && !isSeller && user && (
                <form onSubmit={handleBid} className="mt-5 space-y-3">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    Your bid
                  </label>
                  <input
                    type="number"
                    min={minBid}
                    step={auction.minIncrementMinor}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Min ${formatPrice(minBid, auction.currency)}`}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={bidding}
                    className="w-full rounded-full bg-brand-500 text-white py-3 text-sm font-semibold hover:bg-brand-hover disabled:opacity-50"
                  >
                    {bidding ? 'Placing bid…' : 'Place bid'}
                  </button>
                  {bidError && (
                    <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{bidError}</p>
                  )}
                  {bidSuccess && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">{bidSuccess}</p>
                  )}
                </form>
              )}

              {isLive && !user && (
                <Link
                  to="/signin"
                  className="mt-5 block text-center rounded-full bg-brand-500 text-white py-3 text-sm font-semibold hover:bg-brand-hover"
                >
                  Sign in to bid
                </Link>
              )}

              {isLive && isSeller && (
                <p className="mt-5 text-xs text-zinc-500 text-center">
                  You cannot bid on your own auction.
                </p>
              )}

              {!isLive && (
                <p className="mt-5 text-xs text-zinc-500 text-center">
                  This auction has ended.
                </p>
              )}
            </div>
          </Reveal>
        </aside>
      </div>
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</dt>
      <dd className="text-zinc-900 mt-1">{value || '—'}</dd>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/AuctionDetail.jsx
// =============================================================