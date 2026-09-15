// =============================================================
// FILE: frontend/src/components/VehicleCard.jsx
// =============================================================
// Purpose:
//   Reusable vehicle card. Whole card is the link. Restrained.
// =============================================================

import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/formatPrice';

export default function VehicleCard({ vehicle }) {
  const primary =
    vehicle.images?.find((img) => img.isPrimary) || vehicle.images?.[0];

  return (
    <Link
      to={`/vehicles/${vehicle._id}`}
      className="group block rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden hover:border-neutral-700 transition-colors"
    >
      <div className="aspect-[4/3] bg-neutral-800 overflow-hidden">
        {primary ? (
          <img
            src={primary.url}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600">
            No image
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-base font-medium tracking-tight text-neutral-100 truncate">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.trim ? ` ${vehicle.trim}` : ''}
        </h3>

        <p className="mt-1 text-sm text-neutral-400 truncate">
          {vehicle.mileage?.toLocaleString('en-KE')} {vehicle.mileageUnit} ·{' '}
          {vehicle.fuelType} · {vehicle.transmission}
        </p>

        <p className="mt-3 text-lg font-semibold text-emerald-400">
          {formatPrice(vehicle.priceAmount, vehicle.priceCurrency)}
        </p>

        <p className="mt-1 text-xs text-neutral-500 truncate">
          {vehicle.location?.city}
          {vehicle.location?.county ? `, ${vehicle.location.county}` : ''}
        </p>
      </div>
    </Link>
  );
}

// =============================================================
// END OF FILE: frontend/src/components/VehicleCard.jsx
// =============================================================