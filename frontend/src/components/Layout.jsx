// =============================================================
// FILE: frontend/src/components/Layout.jsx
// =============================================================
// Purpose:
//   Site chrome. White header with logo, red bottom border,
//   black footer. Nav includes Auctions. Admin dropdown
//   includes auction moderation.
// =============================================================

import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-brand-500' : 'text-zinc-700 hover:text-zinc-900'
  }`;

export default function Layout() {
  const { user, logout, isSeller, isAdmin } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col">
      {/* ---------- Header ---------- */}
      <header className="bg-white sticky top-0 z-30 border-b-2 border-brand-500">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between gap-6">
          <Link to="/" className="shrink-0 flex items-center gap-3">
            <img
              src="/logo-navbar.png"
              alt="Car Marketplace"
              className="h-11 w-auto"
            />
            <span className="hidden sm:block text-lg font-extrabold tracking-tight text-zinc-900">
              Car Marketplace
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/vehicles" className={navLinkClass}>
              Browse
            </NavLink>

            <NavLink to="/auctions" className={navLinkClass}>
              Auctions
            </NavLink>

            {user && (
              <NavLink to="/favorites" className={navLinkClass}>
                Saved
              </NavLink>
            )}

            {user && (
              <NavLink to="/viewings" className={navLinkClass}>
                My viewings
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
          </nav>

          <div className="flex items-center gap-3">
            {!user && (
              <NavLink
                to="/signin"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 hidden sm:block"
              >
                Sign in
              </NavLink>
            )}

            {!user && (
              <NavLink
                to="/signup"
                className="text-sm font-semibold rounded-full bg-brand-500 text-white px-5 py-2.5 hover:bg-brand-hover transition-colors"
              >
                Sell a car
              </NavLink>
            )}

            {user && (
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* ---------- Footer: BLACK ---------- */}
      <footer className="bg-black text-zinc-400">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <h4 className="text-white mb-5 text-base font-semibold normal-case tracking-normal">
                Nairobi Branch
              </h4>
              <ul className="space-y-4 text-sm">
                <li className="flex gap-3">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 21s-7-5.686-7-11a7 7 0 1 1 14 0c0 5.314-7 11-7 11Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  <span>Ngong Road, Nairobi<br />Kenya</span>
                </li>
                <li className="flex gap-3">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92Z" />
                  </svg>
                  <span>+254 700 000 000</span>
                </li>
                <li className="flex gap-3">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                  <span>hello@carmarketplace.co.ke</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white mb-5 text-base font-semibold normal-case tracking-normal">
                Browse
              </h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/vehicles" className="hover:text-white">All vehicles</Link></li>
                <li><Link to="/auctions" className="hover:text-white">Live auctions</Link></li>
                <li><Link to="/vehicles?bodyType=suv" className="hover:text-white">SUVs</Link></li>
                <li><Link to="/vehicles?bodyType=sedan" className="hover:text-white">Sedans</Link></li>
                <li><Link to="/vehicles?bodyType=pickup" className="hover:text-white">Pickups</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white mb-5 text-base font-semibold normal-case tracking-normal">
                Sell
              </h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/signup" className="hover:text-white">List a vehicle</Link></li>
                <li><Link to="/seller/auctions/new" className="hover:text-white">Submit for auction</Link></li>
                <li><Link to="/seller" className="hover:text-white">Seller dashboard</Link></li>
                <li><Link to="/help" className="hover:text-white">Selling guide</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white mb-5 text-base font-semibold normal-case tracking-normal">
                Company
              </h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/about" className="hover:text-white">About</Link></li>
                <li><Link to="/help" className="hover:text-white">Help</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-14 pt-8 border-t border-zinc-800 flex flex-wrap items-center justify-between text-xs text-zinc-500 gap-4">
            <span>© {new Date().getFullYear()} Car Marketplace</span>
            <span>Nairobi, Kenya</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/components/Layout.jsx
// =============================================================