// =============================================================
// FILE: frontend/src/pages/ReceiptView.jsx
// =============================================================
// Purpose:
//   Display the buyer's own receipt as plain text in a
//   monospace card. Copy-to-clipboard button top right.
// =============================================================

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import Reveal from '../components/Reveal';

export default function ReceiptView() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/viewings/${id}/receipt`)
      .then((r) => { if (!cancelled) setReceipt(r.data.data); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  async function handleCopy() {
    if (!receipt?.text) return;
    try {
      await navigator.clipboard.writeText(receipt.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore — clipboard may be blocked in some contexts
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        to="/viewings"
        className="text-sm font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-900"
      >
        ← Back to my viewings
      </Link>

      {loading && <p className="mt-6 text-sm text-zinc-500">Loading receipt…</p>}

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {receipt && (
        <Reveal>
          <div className="mt-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl text-zinc-900">Receipt</h1>
              <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500 font-semibold">
                {receipt.receiptNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-700 hover:border-zinc-900 transition-colors"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <pre className="mt-6 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-xs text-zinc-800 font-mono leading-relaxed overflow-x-auto">
            {receipt.text}
          </pre>
        </Reveal>
      )}
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/ReceiptView.jsx
// =============================================================