// =============================================================
// FILE: frontend/src/pages/ReportListing.jsx
// =============================================================

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

const REASONS = [
  { value: 'fraud', label: 'Fraud or scam' },
  { value: 'inaccurate', label: 'Inaccurate information' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'duplicate', label: 'Duplicate listing' },
  { value: 'other', label: 'Other' },
];

export default function ReportListing() {
  const { id } = useParams();
  const [reason, setReason] = useState('fraud');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/reports', {
        targetType: 'vehicle',
        targetId: id,
        reason,
        details,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Could not send report.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8">
          <h1 className="text-2xl font-extrabold text-zinc-900">Report received</h1>
          <p className="mt-3 text-sm text-zinc-600">
            Thanks — our team will review this listing. You can keep browsing.
          </p>
          <Link to={`/vehicles/${id}`} className="mt-6 inline-block text-sm font-semibold text-brand-500 hover:text-brand-hover">
            ← Back to the listing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Link to={`/vehicles/${id}`} className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider">
        ← Back to the listing
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold text-zinc-900">Report this listing</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Reports are confidential. Only our moderation team sees them.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
            Reason
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
            What's wrong? (optional)
          </label>
          <textarea
            rows={5}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={2000}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 resize-y"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand-500 text-white py-3 text-sm font-semibold hover:bg-brand-hover disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Submit report'}
        </button>
      </form>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/ReportListing.jsx
// =============================================================