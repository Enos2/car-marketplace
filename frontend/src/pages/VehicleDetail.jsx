/* eslint-disable react-hooks/set-state-in-effect */
// =============================================================
// FILE: frontend/src/pages/VehicleDetail.jsx
// =============================================================

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { vehicleApi } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import Reveal from '../components/Reveal';

export default function VehicleDetail() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    vehicleApi
      .get(id)
      .then((res) => {
        if (cancelled) return;
        setVehicle(res.data);
        setActiveImage(0);
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-neutral-500">Loading vehicle…</div>;
  }
  if (error || !vehicle) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          {error || 'Vehicle not found'}
        </div>
        <Link to="/vehicles" className="mt-6 inline-block text-sm text-neutral-400 hover:text-neutral-100">← Back to vehicles</Link>
      </div>
    );
  }

  const images = vehicle.images || [];
  const primary = images[activeImage] || null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link to="/vehicles" className="text-sm text-neutral-500 hover:text-neutral-200">← Back to vehicles</Link>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-10">
        <div>
          <Reveal>
            <div className="aspect-[4/3] rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
              {primary ? (
                <img src={primary.url} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-neutral-600">No image</div>
              )}
            </div>
          </Reveal>

          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((img, i) => (
                <button key={img._id || i} type="button" onClick={() => setActiveImage(i)} className={`aspect-square rounded border overflow-hidden ${i === activeImage ? 'border-emerald-500' : 'border-neutral-800'}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <section className="mt-10">
            <h2 className="text-lg font-medium tracking-tight">Description</h2>
            <p className="mt-3 text-sm text-neutral-300 whitespace-pre-line">
              {vehicle.description || 'No description provided.'}
            </p>
          </section>

          {vehicle.features?.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-medium tracking-tight">Features</h2>
              <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-neutral-400">
                {vehicle.features.map((f, i) => (
                  <li key={i} className="border border-neutral-800 rounded px-3 py-2">{f}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-lg font-medium tracking-tight">Specifications</h2>
            <dl className="mt-3 grid grid-cols-2 gap-y-3 text-sm">
              <Spec label="Make" value={vehicle.make} />
              <Spec label="Model" value={vehicle.model} />
              {vehicle.trim && <Spec label="Trim" value={vehicle.trim} />}
              <Spec label="Year" value={vehicle.year} />
              <Spec label="Mileage" value={`${vehicle.mileage?.toLocaleString('en-KE')} ${vehicle.mileageUnit}`} />
              <Spec label="Condition" value={cap(vehicle.condition)} />
              <Spec label="Body type" value={cap(vehicle.bodyType)} />
              <Spec label="Fuel" value={cap(vehicle.fuelType)} />
              <Spec label="Transmission" value={cap(vehicle.transmission)} />
              <Spec label="Location" value={[vehicle.location?.city, vehicle.location?.county].filter(Boolean).join(', ')} />
            </dl>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 self-start">
          <Reveal delay={80}>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
              <h1 className="text-2xl font-semibold tracking-tight">
                {vehicle.year} {vehicle.make} {vehicle.model}
                {vehicle.trim ? ` ${vehicle.trim}` : ''}
              </h1>
              <p className="mt-1 text-sm text-neutral-400">
                {vehicle.location?.city}
                {vehicle.location?.county ? `, ${vehicle.location.county}` : ''}
              </p>

              <p className="mt-5 text-3xl font-semibold text-emerald-400">
                {formatPrice(vehicle.priceAmount, vehicle.priceCurrency)}
              </p>
              {vehicle.negotiable && <p className="mt-1 text-xs text-neutral-500">Negotiable</p>}

              <div className="mt-6 space-y-2">
                <Link to={`/vehicles/${vehicle._id}/book`} className="block text-center rounded bg-emerald-500 text-neutral-950 py-2.5 text-sm font-medium hover:bg-emerald-400 transition-colors">
                  Book a viewing
                </Link>
                <Link to={`/vehicles/${vehicle._id}/contact`} className="block text-center rounded border border-neutral-700 py-2.5 text-sm font-medium text-neutral-200 hover:border-neutral-500 transition-colors">
                  Contact seller
                </Link>
              </div>

              {vehicle.seller && (
                <div className="mt-6 pt-6 border-t border-neutral-800">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Seller</p>
                  <p className="mt-2 text-sm text-neutral-200">{vehicle.seller.name}</p>
                  {vehicle.seller.verificationStatus === 'verified' && (
                    <p className="mt-1 text-xs text-emerald-400">Verified seller</p>
                  )}
                </div>
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
      <dt className="text-neutral-500 text-xs uppercase tracking-wide">{label}</dt>
      <dd className="text-neutral-200 mt-0.5">{value || '—'}</dd>
    </div>
  );
}

function cap(s) {
  return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '—';
}

// =============================================================
// END OF FILE: frontend/src/pages/VehicleDetail.jsx
// =============================================================