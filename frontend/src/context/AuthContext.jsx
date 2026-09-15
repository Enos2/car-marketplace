/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
// =============================================================
// FILE: frontend/src/context/AuthContext.jsx
// =============================================================
// Purpose:
//   Global auth state. On mount, asks /auth/me to see if a valid
//   session cookie is present. Exposes login/register/logout.
// =============================================================

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user: me } = await authApi.me();
      setUser(me || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const { user: me } = await authApi.login(email, password);
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: me } = await authApi.register(payload);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isSeller: user?.role === 'seller' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// =============================================================
// END OF FILE: frontend/src/context/AuthContext.jsx
// =============================================================