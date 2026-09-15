// =============================================================
// FILE: frontend/src/pages/Home.jsx
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
      vehicleApi.list({ limit: 9, sort: 'newest' }),
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
      <section className="border-b border-neutral-800">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight max-w-2xl">
              Find the right vehicle in Kenya.
            </h1>
          </Reveal>
          <Reveal delay={60}>
            <p className="mt-4 text-neutral-400 max-w-xl text-base">
              Browse listings from dealers and private sellers. Compare prices,
              contact sellers, and book a viewing before you buy.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/vehicles" className="rounded bg-emerald-500 text-neutral-950 px-5 py-2.5 text-sm font-medium hover:bg-emerald-400 transition-colors">
                Browse vehicles
              </Link>
              <Link to="/signup" className="rounded border border-neutral-700 px-5 py-2.5 text-sm font-medium text-neutral-200 hover:border-neutral-500 transition-colors">
                Sell a vehicle
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {error && (
        <section className="mx-auto max-w-6xl px-6 py-8">
          <div className="rounded border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            Failed to load vehicles: {error}
          </div>
        </section>
      )}

      {!error && featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <Reveal>
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Featured</h2>
                <p className="mt-1 text-sm text-neutral-400">Hand-picked listings from trusted sellers.</p>
              </div>
            </div>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((v, i) => (
              <Reveal key={v._id} delay={i * 40}>
                <VehicleCard vehicle={v} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <Reveal>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Latest listings</h2>
              <p className="mt-1 text-sm text-neutral-400">
                {loading ? 'Loading…' : `${latest.length} of our newest vehicles`}
              </p>
            </div>
            <Link to="/vehicles" className="text-sm text-neutral-400 hover:text-neutral-100">View all</Link>
          </div>
        </Reveal>

        {!loading && latest.length === 0 && (
          <div className="rounded border border-neutral-800 bg-neutral-900 p-8 text-center text-sm text-neutral-400">
            No vehicles published yet.
          </div>
        )}

        {latest.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((v, i) => (
              <Reveal key={v._id} delay={(i % 3) * 40}>
                <VehicleCard vehicle={v} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/Home.jsx
// =============================================================