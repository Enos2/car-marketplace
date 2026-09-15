// =============================================================
// FILE: frontend/src/App.jsx
// =============================================================

import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import ContactSeller from './pages/ContactSeller';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';

function Placeholder({ name }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
      <p className="mt-2 text-sm text-neutral-400">This page will be implemented in a later batch.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
        <Route path="/vehicles/:id/contact" element={<ContactSeller />} />
        <Route path="/vehicles/:id/book" element={<Placeholder name="Book a viewing" />} />

        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        <Route path="/favorites" element={<Placeholder name="Favorites" />} />
        <Route path="/viewings" element={<Placeholder name="My viewings" />} />
        <Route path="/saved-searches" element={<Placeholder name="Saved searches" />} />
        <Route path="/seller" element={<Placeholder name="Seller dashboard" />} />
        <Route path="/admin" element={<Placeholder name="Admin" />} />

        <Route path="*" element={<Placeholder name="Not found" />} />
      </Route>
    </Routes>
  );
}

// =============================================================
// END OF FILE: frontend/src/App.jsx
// =============================================================