// =============================================================
// FILE: frontend/src/pages/NewListing.jsx
// =============================================================
// Purpose:
//   Create a new vehicle listing. On success, redirect to the
//   edit page where photos can be uploaded.
// =============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const initialForm = {
  make: '',
  model: '',
  trim: '',
  year: new Date().getFullYear(),
  priceAmountMajor: '',
  priceCurrency: 'KES',
  negotiable: false,
  mileage: '',
  mileageUnit: 'km',
  condition: 'used',
  bodyType: 'suv',
  fuelType: 'petrol',
  transmission: 'automatic',
  county: '',
  city: '',
  description: '',
  features: '',
};

export default function NewListing() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const update = (k) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        make: form.make.trim(),
        model: form.model.trim(),
        trim: form.trim.trim(),
        year: Number(form.year),
        priceAmount: Math.round(Number(form.priceAmountMajor) * 100),
        priceCurrency: form.priceCurrency,
        negotiable: !!form.negotiable,
        mileage: Number(form.mileage),
        mileageUnit: form.mileageUnit,
        condition: form.condition,
        bodyType: form.bodyType,
        fuelType: form.fuelType,
        transmission: form.transmission,
        location: { country: 'Kenya', county: form.county, city: form.city },
        description: form.description,
        features: form.features
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const r = await api.post('/vehicles', payload);
      navigate(`/seller/listings/${r.data.data._id}/edit`);
    } catch (err) {
      setError(err.message || 'Could not create listing.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/seller/listings" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider">
        ← My listings
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold text-zinc-900">New listing</h1>
      <p className="mt-1 text-sm text-zinc-500">
        After saving, you&apos;ll be able to upload photos.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Make" value={form.make} onChange={update('make')} required />
          <Field label="Model" value={form.model} onChange={update('model')} required />
          <Field label="Trim (optional)" value={form.trim} onChange={update('trim')} />
          <Field label="Year" type="number" value={form.year} onChange={update('year')} required />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Price (major units)" type="number" value={form.priceAmountMajor} onChange={update('priceAmountMajor')} required />
          <SelectField label="Currency" value={form.priceCurrency} onChange={update('priceCurrency')} options={['KES', 'USD']} />
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" checked={form.negotiable} onChange={update('negotiable')} />
              Negotiable
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Mileage" type="number" value={form.mileage} onChange={update('mileage')} required />
          <SelectField label="Unit" value={form.mileageUnit} onChange={update('mileageUnit')} options={['km', 'mi']} />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <SelectField label="Condition" value={form.condition} onChange={update('condition')} options={['new', 'used', 'certified']} />
          <SelectField label="Body type" value={form.bodyType} onChange={update('bodyType')} options={['sedan', 'suv', 'hatchback', 'pickup', 'van', 'coupe', 'wagon', 'convertible', 'other']} />
          <SelectField label="Fuel" value={form.fuelType} onChange={update('fuelType')} options={['petrol', 'diesel', 'hybrid', 'plug-in-hybrid', 'electric', 'other']} />
          <SelectField label="Transmission" value={form.transmission} onChange={update('transmission')} options={['automatic', 'manual', 'cvt', 'other']} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="County" value={form.county} onChange={update('county')} />
          <Field label="City" value={form.city} onChange={update('city')} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={update('description')}
            rows={5}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-y"
            placeholder="Condition, service history, extras, anything a buyer should know."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
            Features (comma-separated)
          </label>
          <input
            type="text"
            value={form.features}
            onChange={update('features')}
            placeholder="Leather seats, Sunroof, Reverse camera"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-brand-500 text-white px-6 py-3 text-sm font-semibold hover:bg-brand-hover disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save draft'}
          </button>
          <Link to="/seller/listings" className="px-6 py-3 text-sm font-semibold text-zinc-600 hover:text-zinc-900">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/NewListing.jsx
// =============================================================