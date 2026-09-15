// =============================================================
// FILE: frontend/src/pages/SignUp.jsx
// =============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const user = await register({ name: name.trim(), email: email.trim(), password, role, phone: phone.trim() });
      navigate(user.role === 'seller' ? '/seller' : '/', { replace: true });
    } catch (err) {
      const details = err.details ? ` (${err.details.map((d) => d.message).join(', ')})` : '';
      setError((err.message || 'Registration failed') + details);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
      <p className="mt-1 text-sm text-neutral-400">Buy, sell, or manage listings on Car Marketplace.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="block text-xs uppercase tracking-wide text-neutral-400 mb-1.5">Full name</label>
          <input id="name" type="text" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:border-neutral-600" />
        </div>
        <div>
          <label htmlFor="email" className="block text-xs uppercase tracking-wide text-neutral-400 mb-1.5">Email</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:border-neutral-600" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-xs uppercase tracking-wide text-neutral-400 mb-1.5">Phone (optional)</label>
          <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:border-neutral-600" />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs uppercase tracking-wide text-neutral-400 mb-1.5">Password (min 8 characters)</label>
          <input id="password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:border-neutral-600" />
        </div>
        <div>
          <label htmlFor="role" className="block text-xs uppercase tracking-wide text-neutral-400 mb-1.5">I want to</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:border-neutral-600">
            <option value="buyer">Buy a vehicle</option>
            <option value="seller">Sell vehicles</option>
          </select>
        </div>

        {error && (
          <div className="rounded border border-red-900 bg-red-950/40 p-3 text-xs text-red-300">{error}</div>
        )}

        <button type="submit" disabled={submitting} className="w-full rounded bg-emerald-500 text-neutral-950 py-2.5 text-sm font-medium hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-400">
        Already have an account? <Link to="/signin" className="text-neutral-100 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/SignUp.jsx
// =============================================================