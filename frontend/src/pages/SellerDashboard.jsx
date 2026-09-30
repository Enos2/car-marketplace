// =============================================================
// FILE: frontend/src/pages/SellerDashboard.jsx
// =============================================================
// Purpose:
//   Seller overview with quick stats and links to listings,
//   inquiries, viewings, and availability.
// =============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Reveal from '../components/Reveal';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/sellers/me/stats')
      .then((r) => { if (!cancelled) setStats(r.data.data); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Reveal>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900">Seller dashboard</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Welcome back, {user?.name}
            </p>
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

      {loading && <p className="mt-8 text-sm text-zinc-500">Loading stats…</p>}

      {stats && (
        <>
          {/* Stat cards */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Total listings" value={stats.listings.total} href="/seller/listings" />
            <Stat label="Published" value={stats.listings.published} href="/seller/listings?status=published" />
            <Stat label="Pending review" value={stats.listings.pending} href="/seller/listings?status=pending" />
            <Stat label="Total views" value={stats.engagement.views} />
            <Stat label="Favorites" value={stats.engagement.favorites} />
            <Stat label="Enquiries" value={stats.engagement.enquiries} href="/seller/inquiries" />
            <Stat label="Viewings booked" value={stats.viewings.total} href="/seller/viewings" />
            <Stat label="Active viewings" value={stats.viewings.active} href="/seller/viewings" />
          </div>

          {/* Quick links */}
          <div className="mt-10 grid md:grid-cols-4 gap-4">
            <Tile to="/seller/listings" title="My listings" desc="Manage vehicles and upload photos" />
            <Tile to="/seller/inquiries" title="Inquiries" desc="Buyer messages about your listings" />
            <Tile to="/seller/viewings" title="Viewings" desc="Scheduled vehicle viewings" />
            <Tile to="/seller/availability" title="Availability" desc="Set your viewing hours and location" />
          </div>

          {/* Recent enquiries */}
          {stats.recentEnquiries?.length > 0 && (
            <section className="mt-12">
              <div className="flex items-end justify-between mb-4">
                <h2 className="text-xl font-bold text-zinc-900">Recent enquiries</h2>
                <Link to="/seller/inquiries" className="text-sm font-semibold text-brand-500 hover:text-brand-hover">
                  View all →
                </Link>
              </div>
              <ul className="space-y-3">
                {stats.recentEnquiries.slice(0, 3).map((e) => (
                  <li key={e._id} className="rounded-lg border border-zinc-200 bg-white p-4">
                    <p className="text-sm font-medium text-zinc-900">
                      {e.name} · <span className="text-zinc-500 font-normal">{e.email}</span>
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      About: {e.vehicle ? `${e.vehicle.year} ${e.vehicle.make} ${e.vehicle.model}` : 'a listing'}
                    </p>
                    <p className="mt-2 text-sm text-zinc-700 line-clamp-2">{e.message}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, href }) {
  const inner = (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400 transition-colors">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-zinc-900">
        {typeof value === 'number' ? value.toLocaleString('en-KE') : value}
      </p>
    </div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}

function Tile({ to, title, desc }) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-brand-500 transition-colors"
    >
      <p className="font-bold text-zinc-900">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{desc}</p>
    </Link>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/SellerDashboard.jsx
// =============================================================