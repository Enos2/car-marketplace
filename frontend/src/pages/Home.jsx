// =============================================================
// FILE: frontend/src/pages/Home.jsx
// =============================================================
// Purpose:
//   Home with a clean hero and vehicle grids. Matches the
//   restrained white aesthetic of the reference sites.
// =============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { vehicleApi } from '../services/api';
import VehicleCard from '../components/VehicleCard';
import Reveal from '../components/Reveal';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      vehicleApi.list({ limit: 3, sort: 'newest' }),
      vehicleApi.list({ limit: 6, sort: 'newest' }),
    ])
      .then(([f, l]) => {
        if (cancelled) return;
        setFeatured(f.data || []);
        setLatest(l.data || []);
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="bg-white border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <Reveal>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-zinc-900 max-w-3xl leading-[1.02] tracking-tight">
              Find your next car in Kenya.
            </h1>
          </Reveal>
          <Reveal delay={60}>
            <p className="mt-5 text-lg text-zinc-600 max-w-xl">
              Browse verified listings from dealers and private sellers.
              Compare prices, contact sellers, and book a viewing before you buy.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/vehicles"
                className="rounded-full bg-brand-500 text-white px-7 py-3 text-sm font-semibold hover:bg-brand-hover transition-colors"
              >
                Browse vehicles
              </Link>
              <Link
                to="/signup"
                className="rounded-full border-2 border-zinc-900 text-zinc-900 px-7 py-3 text-sm font-semibold hover:bg-zinc-900 hover:text-white transition-colors"
              >
                Sell a car
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Featured ---------- */}
      {!error && featured.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-14">
            <Reveal>
              <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-zinc-900">
                  Featured vehicles
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Hand-picked listings from trusted sellers.
                </p>
              </div>
            </Reveal>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((v, i) => (
                <Reveal key={v._id} delay={i * 60}>
                  <VehicleCard vehicle={v} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Latest ---------- */}
      <section className="bg-zinc-50 border-y border-zinc-100">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <Reveal>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-zinc-900">
                  Latest listings
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  {loading ? 'Loading…' : `${latest.length} newest vehicles`}
                </p>
              </div>
              <Link
                to="/vehicles"
                className="text-sm font-semibold text-brand-500 hover:text-brand-hover"
              >
                View all →
              </Link>
            </div>
          </Reveal>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Failed to load vehicles: {error}
            </div>
          )}

          {!loading && !error && latest.length === 0 && (
            <div className="rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
              No vehicles published yet.
            </div>
          )}

          {latest.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((v, i) => (
                <Reveal key={v._id} delay={(i % 3) * 60}>
                  <VehicleCard vehicle={v} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/Home.jsx
// =============================================================