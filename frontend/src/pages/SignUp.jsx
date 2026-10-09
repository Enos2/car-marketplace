// =============================================================
// FILE: frontend/src/pages/SignUp.jsx
// =============================================================
// Purpose:
//   Registration form. Light theme. Password visibility toggle.
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
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const user = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        phone: phone.trim(),
      });
      navigate(user.role === 'seller' ? '/seller' : '/', { replace: true });
    } catch (err) {
      const details = err.details
        ? ` (${err.details.map((d) => d.message).join(', ')})`
        : '';
      setError((err.message || 'Registration failed') + details);
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-brand-500';
  const labelClass =
    'block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2';

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-extrabold text-zinc-900">Create account</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Buy, sell, or manage listings on Car Marketplace.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className={labelClass}>Full name</label>
          <input
            id="name" type="text" required minLength={2}
            value={name} onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input
            id="email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>Phone (optional)</label>
          <input
            id="phone" type="tel"
            value={phone} onChange={(e) => setPhone(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>Password (min 8 characters)</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${fieldClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 focus:outline-none"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="role" className={labelClass}>I want to</label>
          <select
            id="role" value={role} onChange={(e) => setRole(e.target.value)}
            className={fieldClass}
          >
            <option value="buyer">Buy a vehicle</option>
            <option value="seller">Sell vehicles</option>
          </select>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand-500 text-white py-3 text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-500">
        Already have an account?{' '}
        <Link to="/signin" className="font-semibold text-brand-500 hover:text-brand-hover">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-6.5 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    </svg>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/SignUp.jsx
// =============================================================