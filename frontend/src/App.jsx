import { useEffect, useState } from 'react';

export default function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">Car Marketplace</span>
          <nav className="flex gap-6 text-sm text-neutral-400">
            <a href="#" className="hover:text-neutral-100">Vehicles</a>
            <a href="#" className="hover:text-neutral-100">Sell</a>
            <a href="#" className="hover:text-neutral-100">Sign in</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Browse vehicles</h1>
        <p className="mt-2 text-sm text-neutral-400">Backend health check:</p>

        <div className="mt-4 rounded border border-neutral-800 bg-neutral-900 p-4 font-mono text-xs">
          {error && <span className="text-red-400">Error: {error}</span>}
          {health && <span className="text-emerald-400">{JSON.stringify(health)}</span>}
          {!health && !error && <span className="text-neutral-500">Loading…</span>}
        </div>
      </main>
    </div>
  );
}