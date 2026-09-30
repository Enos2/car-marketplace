/* eslint-disable react-hooks/set-state-in-effect */
// =============================================================
// FILE: frontend/src/pages/BookViewing.jsx
// =============================================================
// Purpose:
//   Two-column booking flow. Left: date picker + slot grid
//   (from /api/vehicles/:id/viewing-slots). Right: form.
//   On success: redirect to MyViewings.
// =============================================================

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { vehicleApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Reveal from '../components/Reveal';
import { formatPrice } from '../utils/formatPrice';

function nextNDays(n) {
  const out = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d);
  }
  return out;
}

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function BookViewing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [vehicleError, setVehicleError] = useState(null);

  const dates = useMemo(() => nextNDays(14), []);
  const [selectedDate, setSelectedDate] = useState(ymd(dates[0]));

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [slotsReason, setSlotsReason] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    preferredContact: 'any',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    vehicleApi
      .get(id)
      .then((res) => { if (!cancelled) setVehicle(res.data); })
      .catch((e) => { if (!cancelled) setVehicleError(e.message); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError(null);
    setSlotsReason(null);
    setSelectedSlot(null);

    api
      .get(`/vehicles/${id}/viewing-slots`, { params: { date: selectedDate } })
      .then((r) => {
        if (cancelled) return;
        const data = r.data.data;
        setSlots(data.slots || []);
        setSlotsReason(data.reason || null);
      })
      .catch((e) => { if (!cancelled) setSlotsError(e.message); })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });

    return () => { cancelled = true; };
  }, [id, selectedDate]);

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedSlot || submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await api.post(`/vehicles/${id}/viewings`, {
        date: selectedDate,
        startTime: selectedSlot.start,
        ...form,
      });
      navigate('/viewings', { replace: true });
    } catch (err) {
      setSubmitError(err.message || 'Could not complete booking.');
    } finally {
      setSubmitting(false);
    }
  }

  if (vehicleError) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {vehicleError}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link
        to={`/vehicles/${id}`}
        className="text-sm font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-900"
      >
        ← Back to vehicle
      </Link>

      <Reveal>
        <h1 className="mt-4 text-4xl text-zinc-900">Book a viewing</h1>
        {vehicle && (
          <p className="mt-2 text-sm text-zinc-500 uppercase tracking-wide">
            {vehicle.year} {vehicle.make} {vehicle.model} —{' '}
            {formatPrice(vehicle.priceAmount, vehicle.priceCurrency)}
          </p>
        )}
      </Reveal>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10">
        {/* ---------- Left: date + slots ---------- */}
        <div>
          <h2 className="section-title text-xl text-zinc-900">Pick a date</h2>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {dates.map((d) => {
              const value = ymd(d);
              const active = value === selectedDate;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedDate(value)}
                  className={`shrink-0 rounded-md border px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                    active
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-zinc-200 text-zinc-700 hover:border-zinc-400'
                  }`}
                >
                  {d.toLocaleDateString('en-KE', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </button>
              );
            })}
          </div>

          <h2 className="section-title mt-10 text-xl text-zinc-900">
            Available times
          </h2>

          {slotsLoading && (
            <p className="mt-5 text-sm text-zinc-500">Loading slots…</p>
          )}

          {!slotsLoading && slotsError && (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {slotsError}
            </div>
          )}

          {!slotsLoading && !slotsError && slots.length === 0 && (
            <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500">
              {slotsReason === 'not-a-working-day'
                ? 'The seller is not available on this day.'
                : slotsReason === 'seller-has-no-availability'
                ? 'This seller has not published viewing availability yet.'
                : 'No slots available on this date.'}
            </div>
          )}

          {!slotsLoading && slots.length > 0 && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {slots.map((s) => {
                const active = selectedSlot?.start === s.start;
                return (
                  <button
                    key={s.start}
                    type="button"
                    onClick={() => setSelectedSlot(s)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-zinc-200 text-zinc-800 hover:border-zinc-400'
                    }`}
                  >
                    {s.start}–{s.end}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ---------- Right: contact form ---------- */}
        <aside>
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.12)]"
          >
            <h2 className="section-title text-xl text-zinc-900">Your details</h2>

            <div className="mt-5 space-y-4">
              <Field
                id="name"
                label="Name"
                value={form.name}
                onChange={update('name')}
                required
              />
              <Field
                id="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={update('email')}
                required
              />
              <Field
                id="phone"
                label="Phone (optional)"
                type="tel"
                value={form.phone}
                onChange={update('phone')}
              />
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-1.5">
                  Preferred contact
                </label>
                <select
                  value={form.preferredContact}
                  onChange={update('preferredContact')}
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                >
                  <option value="any">Any</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-1.5">
                  Note (optional)
                </label>
                <textarea
                  value={form.note}
                  onChange={update('note')}
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-y"
                />
              </div>
            </div>

            <div className="mt-6 rounded-md bg-zinc-50 border border-zinc-200 p-3 text-sm">
              <span className="text-zinc-500">Selected: </span>
              {selectedSlot ? (
                <span className="font-medium text-zinc-900">
                  {selectedDate} · {selectedSlot.start}–{selectedSlot.end}
                </span>
              ) : (
                <span className="text-zinc-400">Choose a date and time</span>
              )}
            </div>

            {submitError && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedSlot || submitting}
              className="mt-5 w-full rounded-md bg-brand-500 text-white py-3 text-sm font-semibold uppercase tracking-wide hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Booking…' : 'Confirm booking'}
            </button>

            <p className="mt-3 text-xs text-zinc-400 text-center">
              Free viewings confirm immediately.
            </p>
          </form>
        </aside>
      </div>
    </div>
  );
}

function Field({ id, label, type = 'text', value, onChange, required }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-1.5"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
      />
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/BookViewing.jsx
// =============================================================