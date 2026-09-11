// =============================================================
// FILE: frontend/src/App.jsx
// =============================================================
// Purpose:
//   Homepage. Fetches published vehicles from the backend and
//   renders them as cards in a responsive grid. Currency display
//   is intentionally the listing's original currency for now;
//   KES/USD conversion is a later layer.
//
// Design:
//   Restrained, neutral surface, one accent. No gradients, no
//   emojis, no decorative fluff (spec §23).
// =============================================================

import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function formatPrice(amountMinor, currency) {
  // amountMinor is an integer in minor units (cents). Convert to
  // major units for display. For KES we show no decimal places —
  // local convention. For USD we show no decimals either for
  // vehicle listings, which is also common practice.
  const major = amountMinor / 100;
  const symbol = currency === 'KES' ? 'KSh' : '$';
  return `${symbol} ${major.toLocaleString('en-KE', {
    maximumFractionDigits: 0,
  })}`;
}

function VehicleCard({ vehicle }) {
  return (
    <article className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
      <div className="aspect-[4/3] bg-neutral-800" />
      <div className="p-4">
        <h2 className="text-base font-medium tracking-tight text-neutral-100">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.trim ? ` ${vehicle.trim}` : ''}
        </h2>
        <p className="mt-1 text-sm text-neutral-400">
          {vehicle.mileage.toLocaleString('en-KE')} {vehicle.mileageUnit} ·{' '}
          {vehicle.fuelType} · {vehicle.transmission}
        </p>
        <p className="mt-3 text-lg font-semibold text-emerald-400">
          {formatPrice(vehicle.priceAmount, vehicle.priceCurrency)}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          {vehicle.location?.city}
          {vehicle.location?.county ? `, ${vehicle.location.county}` : ''}
        </p>
      </div>
    </article>
  );
}

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_URL}/vehicles`)
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed: ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        setVehicles(json.data || []);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">
            Car Marketplace
          </span>
          <nav className="flex gap-6 text-sm text-neutral-400">
            <a href="#" className="hover:text-neutral-100">
              Vehicles
            </a>
            <a href="#" className="hover:text-neutral-100">
              Sell
            </a>
            <a href="#" className="hover:text-neutral-100">
              Sign in
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Browse vehicles
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              {loading
                ? 'Loading inventory…'
                : `${vehicles.length} vehicles available`}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            Failed to load vehicles: {error}
          </div>
        )}

        {!error && !loading && vehicles.length === 0 && (
          <div className="mt-8 rounded border border-neutral-800 bg-neutral-900 p-8 text-center text-sm text-neutral-400">
            No vehicles available yet.
          </div>
        )}

        {!error && vehicles.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <VehicleCard key={v._id} vehicle={v} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/App.jsx
// =============================================================