// =============================================================
// FILE: frontend/src/components/VehicleCard.jsx
// =============================================================
// Purpose:
//   Card layout matched to your reference: photo top with badge
//   chips, spec icon row, price prominent, seller block, dual
//   CTAs. Honest empty state when no photo exists.
// =============================================================

import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/formatPrice';

export default function VehicleCard({ vehicle }) {
  const images = vehicle.images || [];
  const primary = images.find((img) => img.isPrimary) || images[0] || null;
  const photoCount = images.length;

  return (
    <article className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden transition-shadow hover:shadow-[0_8px_28px_-12px_rgba(0,0,0,0.18)]">
      {/* ---------- Image area ---------- */}
      <Link to={`/vehicles/${vehicle._id}`} className="block">
        <div className="relative aspect-4/3 bg-zinc-100 overflow-hidden">
          {primary ? (
            <img
              src={primary.url}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            // Honest, designed empty state. Not a grey box.
            <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-zinc-50 to-zinc-100 px-6 text-center">
              <span className="text-3xl font-extrabold text-zinc-400 tracking-tight">
                {vehicle.make}
              </span>
              <span className="text-sm text-zinc-500 mt-1 font-medium">
                {vehicle.model}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 mt-4">
                Photos coming soon
              </span>
            </div>
          )}

          {/* Photo count — top left (matches reference) */}
          {photoCount > 1 && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 text-white text-xs px-2.5 py-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="6" width="18" height="14" rx="2" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              {photoCount}
            </span>
          )}

          {/* Condition badge — top right (matches reference) */}
          <span className="absolute top-3 right-3 rounded-full bg-brand-500 text-white text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1">
            {vehicle.condition || 'Used'}
          </span>
        </div>
      </Link>

      {/* ---------- Body ---------- */}
      <div className="p-5">
        <Link to={`/vehicles/${vehicle._id}`}>
          <h3 className="text-base font-bold text-zinc-900 truncate">
            {vehicle.year} {vehicle.make} {vehicle.model}
            {vehicle.trim ? ` ${vehicle.trim}` : ''}
          </h3>
        </Link>

        <p className="mt-2 text-xl font-extrabold text-brand-500 tracking-tight">
          {formatPrice(vehicle.priceAmount, vehicle.priceCurrency)}
        </p>
        {vehicle.negotiable && (
          <p className="mt-0.5 text-xs text-zinc-500">Negotiable</p>
        )}

        {/* Spec row */}
        <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-600 border-t border-zinc-100 pt-3">
          <SpecItem icon="mileage" text={`${vehicle.mileage?.toLocaleString('en-KE')} ${vehicle.mileageUnit}`} />
          <SpecItem icon="fuel" text={cap(vehicle.fuelType)} />
          <SpecItem icon="gear" text={cap(vehicle.transmission)} />
        </ul>

        {/* Seller + CTAs */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-800 truncate">
              {vehicle.seller?.name || 'Seller'}
            </p>
            <p className="text-xs text-zinc-500 truncate">
              {vehicle.location?.city}
              {vehicle.location?.county ? `, ${vehicle.location.county}` : ''}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to={`/vehicles/${vehicle._id}/book`}
            className="text-center text-sm font-semibold rounded-lg bg-brand-500 text-white py-2.5 hover:bg-brand-hover transition-colors"
          >
            Book viewing
          </Link>
          <Link
            to={`/vehicles/${vehicle._id}`}
            className="text-center text-sm font-semibold rounded-lg border border-zinc-300 text-zinc-800 py-2.5 hover:border-zinc-900 transition-colors"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}

function SpecItem({ icon, text }) {
  const iconPath = {
    mileage: <><path d="M12 21s-7-5.686-7-11a7 7 0 1 1 14 0c0 5.314-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
    fuel: <><path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M3 10h12" /><path d="M15 10h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-6l-3-3" /></>,
    gear: <><circle cx="12" cy="12" r="2.5" /><path d="M12 2v6" /><path d="M12 16v6" /><path d="m4.9 4.9 4.2 4.2" /><path d="m14.9 14.9 4.2 4.2" /><path d="m4.9 19.1 4.2-4.2" /><path d="m14.9 9.1 4.2-4.2" /></>,
  }[icon];

  return (
    <li className="flex items-center gap-1.5">
      <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {iconPath}
      </svg>
      <span className="truncate">{text}</span>
    </li>
  );
}

function cap(s) {
  return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '—';
}

// =============================================================
// END OF FILE: frontend/src/components/VehicleCard.jsx
// =============================================================