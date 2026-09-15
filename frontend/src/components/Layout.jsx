// =============================================================
// FILE: frontend/src/components/Layout.jsx
// =============================================================
// Purpose:
//   Site chrome: header, nav, footer. Wraps every page.
// =============================================================

import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinkClass = ({ isActive }) =>
  `text-sm transition-colors ${
    isActive ? 'text-neutral-100' : 'text-neutral-400 hover:text-neutral-100'
  }`;

export default function Layout() {
  const { user, logout, isSeller, isAdmin } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <header className="border-b border-neutral-800 sticky top-0 z-30 bg-neutral-950/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Car Marketplace
          </Link>

          <nav className="flex items-center gap-6">
            <NavLink to="/vehicles" className={navLinkClass}>
              Vehicles
            </NavLink>

            {user && (
              <NavLink to="/favorites" className={navLinkClass}>
                Favorites
              </NavLink>
            )}

            {isSeller && (
              <NavLink to="/seller" className={navLinkClass}>
                Dashboard
              </NavLink>
            )}

            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                Admin
              </NavLink>
            )}

            {!user && (
              <NavLink to="/signin" className={navLinkClass}>
                Sign in
              </NavLink>
            )}

            {!user && (
              <NavLink
                to="/signup"
                className="text-sm rounded bg-emerald-500 text-neutral-950 px-3 py-1.5 font-medium hover:bg-emerald-400 transition-colors"
              >
                Sell a vehicle
              </NavLink>
            )}

            {user && (
              <button
                onClick={handleLogout}
                className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors"
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-800 mt-16">
        <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-neutral-500 flex flex-wrap items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} Car Marketplace</span>
          <div className="flex gap-6">
            <Link to="/about" className="hover:text-neutral-300">About</Link>
            <Link to="/help" className="hover:text-neutral-300">Help</Link>
            <Link to="/terms" className="hover:text-neutral-300">Terms</Link>
            <Link to="/privacy" className="hover:text-neutral-300">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/components/Layout.jsx
// =============================================================