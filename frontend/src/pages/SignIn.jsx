// =============================================================
// FILE: frontend/src/pages/SignIn.jsx
// =============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-neutral-400">Enter your credentials to continue.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs uppercase tracking-wide text-neutral-400 mb-1.5">Email</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:border-neutral-600" />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs uppercase tracking-wide text-neutral-400 mb-1.5">Password</label>
          <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:border-neutral-600" />
        </div>

        {error && (
          <div className="rounded border border-red-900 bg-red-950/40 p-3 text-xs text-red-300">{error}</div>
        )}

        <button type="submit" disabled={submitting} className="w-full rounded bg-emerald-500 text-neutral-950 py-2.5 text-sm font-medium hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-400">
        Don&apos;t have an account? <Link to="/signup" className="text-neutral-100 hover:underline">Create one</Link>
      </p>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/SignIn.jsx
// =============================================================