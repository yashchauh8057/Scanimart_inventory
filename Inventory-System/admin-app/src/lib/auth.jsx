import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

const KEY = 'scanimartSession';

const ROLES = {
  admin: 'http://127.0.0.1:5500/frontend/dashboard.html',
  user: '/checkout',
  staff: '/cash-counter',
  security: '/exit-check'
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
  });

  useEffect(() => {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  }, [session]);

  const value = useMemo(() => ({
    session,
    async signIn(email, password) {
      const account = await api.login({ email, password });
      const next = { user: account.name, email: account.email, role: account.role };
      setSession(next);
      return next;
    },
    signOut() { setSession(null); },
    homeFor(role) { return ROLES[role] || '/checkout'; }
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
