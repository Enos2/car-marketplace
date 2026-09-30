// =============================================================
// FILE: frontend/src/App.jsx
// =============================================================
// Purpose:
//   Route table. Admin routes wired. 404 fallback.
// =============================================================

import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import ContactSeller from './pages/ContactSeller';
import BookViewing from './pages/BookViewing';
import MyViewings from './pages/MyViewings';
import ReceiptView from './pages/ReceiptView';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import SellerDashboard from './pages/SellerDashboard';
import SellerListings from './pages/SellerListings';
import NewListing from './pages/NewListing';
import EditListing from './pages/EditListing';
import SellerAvailability from './pages/SellerAvailability';
import SellerInquiries from './pages/SellerInquiries';
import SellerViewings from './pages/SellerViewings';
import AdminDashboard from './pages/AdminDashboard';
import AdminListings from './pages/AdminListings';
import AdminUsers from './pages/AdminUsers';
import AdminReports from './pages/AdminReports';
import AdminViewings from './pages/AdminViewings';
import AdminAuditLogs from './pages/AdminAuditLogs';
import { useAuth } from './context/AuthContext';

function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">
        404
      </p>
      <h1 className="mt-4 text-4xl font-extrabold text-zinc-900">
        Page not found
      </h1>
      <p className="mt-3 text-sm text-zinc-500">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-8 inline-block rounded-full bg-brand-500 text-white px-6 py-3 text-sm font-semibold hover:bg-brand-hover transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}

function RequireSeller({ children }) {
  const { user, loading, isSeller } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/signin" replace />;
  if (!isSeller) return <Navigate to="/" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/signin" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
        <Route path="/vehicles/:id/contact" element={<ContactSeller />} />
        <Route path="/vehicles/:id/book" element={<BookViewing />} />

        <Route path="/viewings" element={<MyViewings />} />
        <Route path="/viewings/:id/receipt" element={<ReceiptView />} />

        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Seller */}
        <Route path="/seller" element={<RequireSeller><SellerDashboard /></RequireSeller>} />
        <Route path="/seller/listings" element={<RequireSeller><SellerListings /></RequireSeller>} />
        <Route path="/seller/listings/new" element={<RequireSeller><NewListing /></RequireSeller>} />
        <Route path="/seller/listings/:id/edit" element={<RequireSeller><EditListing /></RequireSeller>} />
        <Route path="/seller/availability" element={<RequireSeller><SellerAvailability /></RequireSeller>} />
        <Route path="/seller/inquiries" element={<RequireSeller><SellerInquiries /></RequireSeller>} />
        <Route path="/seller/viewings" element={<RequireSeller><SellerViewings /></RequireSeller>} />

        {/* Admin */}
        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="/admin/listings" element={<RequireAdmin><AdminListings /></RequireAdmin>} />
        <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
        <Route path="/admin/reports" element={<RequireAdmin><AdminReports /></RequireAdmin>} />
        <Route path="/admin/viewings" element={<RequireAdmin><AdminViewings /></RequireAdmin>} />
        <Route path="/admin/audit-logs" element={<RequireAdmin><AdminAuditLogs /></RequireAdmin>} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

// =============================================================
// END OF FILE: frontend/src/App.jsx
// =============================================================