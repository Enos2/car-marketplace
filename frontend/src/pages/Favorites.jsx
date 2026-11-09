// =============================================================
// FILE: frontend/src/pages/Favorites.jsx
// =============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import VehicleCard from '../components/VehicleCard';
import Reveal from '../components/Reveal';

export default function Favorites() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/favorites', { params: { limit: 50 } })
      .then((r) => { if (!cancelled) setItems(r.data.data || []); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Reveal>
        <h1 className="text-4xl font-extrabold text-zinc-900">Saved vehicles</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {loading ? 'Loading…' : `${items.length} saved`}
        </p>
      </Reveal>

      {error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="mt-10 rounded-lg border border-zinc-200 bg-white p-12 text-center">
          <p className="text-sm text-zinc-500">You haven't saved any vehicles yet.</p>
          <Link to="/vehicles" className="mt-4 inline-block text-sm font-semibold text-brand-500 hover:text-brand-hover">
            Browse vehicles →
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((v, i) => (
            <Reveal key={v._id} delay={(i % 3) * 40}>
              <VehicleCard vehicle={v} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/Favorites.jsx
// =============================================================