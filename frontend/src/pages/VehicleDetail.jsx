/* eslint-disable react-hooks/set-state-in-effect */
// =============================================================
// FILE: frontend/src/pages/VehicleDetail.jsx
// =============================================================
// Purpose:
//   Full vehicle page. Light theme. Right column is a white
//   card with a shadow. Red primary CTA, black outline
//   secondary. Price in black.
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
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-sm text-zinc-500">
        Loading vehicle…
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error || 'Vehicle not found'}
        </div>
        <Link
          to="/vehicles"
          className="mt-6 inline-block text-sm font-semibold text-zinc-600 hover:text-zinc-900"
        >
          ← Back to vehicles
        </Link>
      </div>
    );
  }

  const images = vehicle.images || [];
  const primary = images[activeImage] || null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link
        to="/vehicles"
        className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider"
      >
        ← Back to vehicles
      </Link>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-10">
        {/* ---------- Left ---------- */}
        <div>
          <Reveal>
            <div className="aspect-4/3 rounded-2xl border border-zinc-200 bg-zinc-100 overflow-hidden">
              {primary ? (
                <img
                  src={primary.url}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400">
                  <span className="text-3xl font-extrabold text-zinc-400">
                    {vehicle.make}
                  </span>
                  <span className="mt-1 text-sm text-zinc-500">
                    {vehicle.model}
                  </span>
                  <span className="mt-6 text-[10px] uppercase tracking-widest text-zinc-400">
                    Photos coming soon
                  </span>
                </div>
              )}
            </div>
          </Reveal>

          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((img, i) => (
                <button
                  key={img._id || i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square rounded-lg border-2 overflow-hidden transition-colors ${
                    i === activeImage
                      ? 'border-brand-500'
                      : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <section className="mt-12">
            <h2 className="text-2xl font-extrabold text-zinc-900">Description</h2>
            <p className="mt-4 text-base text-zinc-700 whitespace-pre-line leading-relaxed">
              {vehicle.description || 'No description provided.'}
            </p>
          </section>

          {vehicle.features?.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-extrabold text-zinc-900">Features</h2>
              <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-zinc-700">
                {vehicle.features.map((f, i) => (
                  <li
                    key={i}
                    className="border border-zinc-200 rounded-lg px-3 py-2 bg-white"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-12">
            <h2 className="text-2xl font-extrabold text-zinc-900">
              Specifications
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-y-5 gap-x-6 text-sm">
              <Spec label="Make" value={vehicle.make} />
              <Spec label="Model" value={vehicle.model} />
              {vehicle.trim && <Spec label="Trim" value={vehicle.trim} />}
              <Spec label="Year" value={vehicle.year} />
              <Spec
                label="Mileage"
                value={`${vehicle.mileage?.toLocaleString('en-KE')} ${vehicle.mileageUnit}`}
              />
              <Spec label="Condition" value={cap(vehicle.condition)} />
              <Spec label="Body type" value={cap(vehicle.bodyType)} />
              <Spec label="Fuel" value={cap(vehicle.fuelType)} />
              <Spec label="Transmission" value={cap(vehicle.transmission)} />
              <Spec
                label="Location"
                value={[vehicle.location?.city, vehicle.location?.county]
                  .filter(Boolean)
                  .join(', ')}
              />
            </dl>
          </section>
        </div>

        {/* ---------- Right: price + actions ---------- */}
        <aside className="lg:sticky lg:top-24 self-start">
          <Reveal delay={80}>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_8px_28px_-12px_rgba(0,0,0,0.15)]">
              <h1 className="text-2xl font-extrabold text-zinc-900 leading-tight">
                {vehicle.year} {vehicle.make} {vehicle.model}
                {vehicle.trim ? ` ${vehicle.trim}` : ''}
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                {vehicle.location?.city}
                {vehicle.location?.county ? `, ${vehicle.location.county}` : ''}
              </p>

              <p className="mt-6 text-3xl font-extrabold text-zinc-900 tracking-tight">
                {formatPrice(vehicle.priceAmount, vehicle.priceCurrency)}
              </p>
              {vehicle.negotiable && (
                <p className="mt-1 text-xs font-semibold text-brand-500 uppercase tracking-wider">
                  Negotiable
                </p>
              )}

              <div className="mt-6 space-y-2">
                <Link
                  to={`/vehicles/${vehicle._id}/book`}
                  className="block text-center rounded-full bg-brand-500 text-white py-3 text-sm font-semibold hover:bg-brand-hover transition-colors"
                >
                  Book a viewing
                </Link>
                <Link
                  to={`/vehicles/${vehicle._id}/contact`}
                  className="block text-center rounded-full border-2 border-zinc-900 text-zinc-900 py-3 text-sm font-semibold hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  Contact seller
                </Link>
              </div>

              {vehicle.seller && (
                <div className="mt-6 pt-6 border-t border-zinc-200">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Seller
                  </p>
                  <p className="mt-2 text-base font-medium text-zinc-900">
                    {vehicle.seller.name}
                  </p>
                  {vehicle.seller.verificationStatus === 'verified' && (
                    <p className="mt-1 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                      ✓ Verified seller
                    </p>
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
      <dt className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        {label}
      </dt>
      <dd className="text-zinc-900 mt-1 text-base">{value || '—'}</dd>
    </div>
  );
}

function cap(s) {
  return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '—';
}

// =============================================================
// END OF FILE: frontend/src/pages/VehicleDetail.jsx
// =============================================================