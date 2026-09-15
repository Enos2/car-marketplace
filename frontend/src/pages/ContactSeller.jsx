// =============================================================
// FILE: frontend/src/pages/ContactSeller.jsx
// =============================================================
// Purpose:
//   Reference page. Contact-seller form for a specific vehicle.
//   Shows the visual system (typography, spacing, inputs,
//   buttons, error and success states) and the reveal animation
//   in a small, self-contained screen.
//
//   Submits to POST /api/vehicles/:id/inquiries.
// =============================================================

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { vehicleApi } from '../services/api';
import Reveal from '../components/Reveal';
import { formatPrice } from '../utils/formatPrice';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  preferredContact: 'any',
  message: '',
};

export default function ContactSeller() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [vehicleError, setVehicleError] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    vehicleApi
      .get(id)
      .then((res) => {
        if (!cancelled) setVehicle(res.data);
      })
      .catch((e) => {
        if (!cancelled) setVehicleError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await api.post(`/vehicles/${id}/inquiries`, form);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || 'Could not send your enquiry.');
    } finally {
      setSubmitting(false);
    }
  }

  // -------- success state --------
  if (submitted) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <Reveal>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <h1 className="text-xl font-semibold tracking-tight">Enquiry sent</h1>
            <p className="mt-2 text-sm text-neutral-400">
              The seller will be notified and can reply to the contact details you
              provided. You can return to browsing whenever you&apos;re ready.
            </p>
            <Link
              to={`/vehicles/${id}`}
              className="mt-6 inline-block text-sm text-neutral-200 hover:text-white"
            >
              ← Back to the vehicle
            </Link>
          </div>
        </Reveal>
      </div>
    );
  }

  // -------- vehicle load error --------
  if (vehicleError) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          {vehicleError}
        </div>
      </div>
    );
  }

  // -------- main form --------
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link to={`/vehicles/${id}`} className="text-sm text-neutral-500 hover:text-neutral-200">
        ← Back to the vehicle
      </Link>

      <Reveal delay={40}>
        <div className="mt-6">
          <h1 className="text-2xl font-semibold tracking-tight">Contact seller</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Send your details and a short message. The seller will reply through
            the contact method you choose below.
          </p>
        </div>
      </Reveal>

      {vehicle && (
        <Reveal delay={80}>
          <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-100 truncate">
                {vehicle.year} {vehicle.make} {vehicle.model}
                {vehicle.trim ? ` ${vehicle.trim}` : ''}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {vehicle.location?.city}
                {vehicle.location?.county ? `, ${vehicle.location.county}` : ''}
              </p>
            </div>
            <p className="text-sm font-semibold text-emerald-400 whitespace-nowrap">
              {formatPrice(vehicle.priceAmount, vehicle.priceCurrency)}
            </p>
          </div>
        </Reveal>
      )}

      <Reveal delay={120}>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <Field
            id="name"
            label="Your name"
            value={form.name}
            onChange={update('name')}
            required
            minLength={2}
            autoComplete="name"
          />

          <Field
            id="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={update('email')}
            required
            autoComplete="email"
          />

          <Field
            id="phone"
            label="Phone (optional)"
            type="tel"
            value={form.phone}
            onChange={update('phone')}
            autoComplete="tel"
          />

          <div>
            <label
              htmlFor="preferredContact"
              className="block text-xs uppercase tracking-wide text-neutral-400 mb-1.5"
            >
              Preferred contact method
            </label>
            <select
              id="preferredContact"
              value={form.preferredContact}
              onChange={update('preferredContact')}
              className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
            >
              <option value="any">Any</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-xs uppercase tracking-wide text-neutral-400 mb-1.5"
            >
              Message
            </label>
            <textarea
              id="message"
              value={form.message}
              onChange={update('message')}
              rows={5}
              required
              minLength={10}
              maxLength={2000}
              placeholder="Ask about availability, condition, service history, or arrange a time to see it."
              className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:border-neutral-600 resize-y"
            />
            <p className="mt-1 text-xs text-neutral-500">
              {form.message.length} / 2000
            </p>
          </div>

          {submitError && (
            <div className="rounded border border-red-900 bg-red-950/40 p-3 text-xs text-red-300">
              {submitError}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-emerald-500 text-neutral-950 px-5 py-2.5 text-sm font-medium hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Sending…' : 'Send enquiry'}
            </button>
            <Link
              to={`/vehicles/${id}`}
              className="text-sm text-neutral-400 hover:text-neutral-100"
            >
              Cancel
            </Link>
          </div>
        </form>
      </Reveal>
    </div>
  );
}

function Field({ id, label, type = 'text', value, onChange, required, ...rest }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs uppercase tracking-wide text-neutral-400 mb-1.5"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
        {...rest}
      />
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/ContactSeller.jsx
// =============================================================