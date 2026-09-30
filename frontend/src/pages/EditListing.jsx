/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
// =============================================================
// FILE: frontend/src/pages/EditListing.jsx
// =============================================================
// Purpose:
//   Edit a listing AND upload photos. Uses the real backend
//   upload pipeline (POST /vehicles/:id/images). Photos are
//   validated by magic bytes, EXIF-stripped, re-encoded to WebP,
//   thumbnails generated. This is the correct mechanism — no
//   fake stock URLs.
// =============================================================

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get(`/vehicles/${id}`);
      const v = r.data.data;
      setListing(v);
      setForm({
        make: v.make || '',
        model: v.model || '',
        trim: v.trim || '',
        year: v.year || new Date().getFullYear(),
        priceAmountMajor: v.priceAmount ? String(v.priceAmount / 100) : '',
        priceCurrency: v.priceCurrency || 'KES',
        negotiable: !!v.negotiable,
        mileage: v.mileage || '',
        mileageUnit: v.mileageUnit || 'km',
        condition: v.condition || 'used',
        bodyType: v.bodyType || 'suv',
        fuelType: v.fuelType || 'petrol',
        transmission: v.transmission || 'automatic',
        county: v.location?.county || '',
        city: v.location?.city || '',
        description: v.description || '',
        features: Array.isArray(v.features) ? v.features.join(', ') : '',
      });
    } catch (e) {
      setLoadErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  const update = (k) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
  };

  async function handleSave(e) {
    e.preventDefault();
    setSaveErr(null);
    setSaving(true);
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
        features: form.features.split(',').map((s) => s.trim()).filter(Boolean),
      };
      await api.patch(`/vehicles/${id}`, payload);
      await load();
    } catch (err) {
      setSaveErr(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    setUploadErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      for (const f of files) fd.append('images', f);
      await api.post(`/vehicles/${id}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await load();
    } catch (err) {
      setUploadErr(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDeleteImage(imageId) {
    if (!confirm('Delete this photo?')) return;
    try {
      await api.delete(`/vehicles/${id}/images/${imageId}`);
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSubmit() {
    if (!confirm('Submit this listing for review?')) return;
    try {
      await api.post(`/vehicles/${id}/submit`);
      navigate('/seller/listings');
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div className="mx-auto max-w-3xl px-6 py-10 text-sm text-zinc-500">Loading…</div>;
  if (loadErr) return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{loadErr}</div>
    </div>
  );
  if (!form || !listing) return null;

  const canSubmit = listing.status === 'draft' || listing.status === 'rejected';

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/seller/listings" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider">
        ← My listings
      </Link>
      <div className="mt-2 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-extrabold text-zinc-900">
          {listing.year} {listing.make} {listing.model}
        </h1>
        <span className="text-xs font-semibold uppercase tracking-wider rounded px-2 py-1 bg-zinc-100 text-zinc-700">
          {listing.status}
        </span>
      </div>

      {/* ---------- Photos ---------- */}
      <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-bold text-zinc-900">Photos</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Upload real photos of the actual vehicle. JPEG, PNG, or WebP. Max 8 MB each.
        </p>

        {listing.images?.length > 0 && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {listing.images.map((img) => (
              <div key={img._id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-zinc-200">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img._id)}
                  className="absolute top-2 right-2 rounded-full bg-black/70 text-white w-7 h-7 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete photo"
                >
                  ×
                </button>
                {img.isPrimary && (
                  <span className="absolute bottom-2 left-2 text-[10px] uppercase tracking-wider font-semibold bg-brand-500 text-white rounded px-1.5 py-0.5">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-full file:border-0 file:bg-brand-500 file:text-white file:font-semibold file:px-5 file:py-2.5 file:cursor-pointer hover:file:bg-brand-hover"
          />
          {uploading && <p className="mt-3 text-sm text-zinc-500">Uploading…</p>}
          {uploadErr && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {uploadErr}
            </div>
          )}
        </div>
      </section>

      {/* ---------- Details ---------- */}
      <form onSubmit={handleSave} className="mt-8 space-y-5">
        <h2 className="text-lg font-bold text-zinc-900">Listing details</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Make" value={form.make} onChange={update('make')} required />
          <Field label="Model" value={form.model} onChange={update('model')} required />
          <Field label="Trim" value={form.trim} onChange={update('trim')} />
          <Field label="Year" type="number" value={form.year} onChange={update('year')} required />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Price (major)" type="number" value={form.priceAmountMajor} onChange={update('priceAmountMajor')} required />
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
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        {saveErr && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {saveErr}
          </div>
        )}

        <div className="flex gap-3 pt-2 flex-wrap">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-500 text-white px-6 py-3 text-sm font-semibold hover:bg-brand-hover disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>

          {canSubmit && (
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-full border-2 border-emerald-600 text-emerald-700 px-6 py-3 text-sm font-semibold hover:bg-emerald-600 hover:text-white transition-colors"
            >
              Submit for review
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">{label}</label>
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
      <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/EditListing.jsx
// =============================================================