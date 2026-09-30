// =============================================================
// FILE: frontend/src/pages/ContactSeller.jsx
// =============================================================
// Purpose:
//   Contact-seller form for a specific vehicle. Light theme:
//   white page, light borders, red primary button, black
//   headings. Submits to POST /api/vehicles/:id/inquiries.
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

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

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
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-[0_8px_28px_-16px_rgba(0,0,0,0.12)]">
            <h1 className="text-2xl font-extrabold text-zinc-900">
              Enquiry sent
            </h1>
            <p className="mt-3 text-sm text-zinc-600">
              The seller will be notified and can reply to the contact details
              you provided. You can return to browsing whenever you&apos;re
              ready.
            </p>
            <Link
              to={`/vehicles/${id}`}
              className="mt-6 inline-block text-sm font-semibold text-brand-500 hover:text-brand-hover"
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {vehicleError}
        </div>
      </div>
    );
  }

  // -------- main form --------
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link
        to={`/vehicles/${id}`}
        className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider"
      >
        ← Back to the vehicle
      </Link>

      <Reveal delay={40}>
        <div className="mt-6">
          <h1 className="text-3xl font-extrabold text-zinc-900">
            Contact seller
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Send your details and a short message. The seller will reply
            through the contact method you choose below.
          </p>
        </div>
      </Reveal>

      {vehicle && (
        <Reveal delay={80}>
          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 truncate">
                {vehicle.year} {vehicle.make} {vehicle.model}
                {vehicle.trim ? ` ${vehicle.trim}` : ''}
              </p>
              <p className="text-xs text-zinc-500 truncate">
                {vehicle.location?.city}
                {vehicle.location?.county ? `, ${vehicle.location.county}` : ''}
              </p>
            </div>
            <p className="text-sm font-bold text-brand-500 whitespace-nowrap">
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
              className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2"
            >
              Preferred contact method
            </label>
            <select
              id="preferredContact"
              value={form.preferredContact}
              onChange={update('preferredContact')}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-brand-500"
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
              className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2"
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
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-brand-500 resize-y"
            />
            <p className="mt-1 text-xs text-zinc-400">
              {form.message.length} / 2000
            </p>
          </div>

          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {submitError}
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-brand-500 text-white px-6 py-3 text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Sending…' : 'Send enquiry'}
            </button>
            <Link
              to={`/vehicles/${id}`}
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-900"
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
        className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-brand-500"
        {...rest}
      />
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/ContactSeller.jsx
// =============================================================