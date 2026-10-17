import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, tokenStore } from '../api/client.js';

const AuthContext = createContext(null);
const USER_KEY = 'ecocycle_user';

const readUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_KEY);
    } catch { /* ignore */ }
  }, [user]);

  const finish = useCallback(({ token, user: u }) => { tokenStore.set(token); setUser(u); return u; }, []);
  const login = useCallback(async (creds) => finish(await api.login(creds)), [finish]);
  const register = useCallback(async (data) => finish(await api.register(data)), [finish]);
  const logout = useCallback(() => { tokenStore.clear(); setUser(null); }, []);

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export const homeFor = (role) => ({ ADMIN: '/admin', COLLECTOR: '/collector', USER: '/user' }[role] || '/login');
