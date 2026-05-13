/**
 * Context Auth — gère le user connecté + son gym
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStorage } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenStorage.accessToken) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((r) => {
        setUser(r.data.data.user);
        setGym(r.data.data.gym);
      })
      .catch(() => {
        tokenStorage.clear();
      })
      .finally(() => setLoading(false));
  }, []);

  async function login({ email, password, subdomain }) {
    const res = await api.post('/auth/login', { email, password, subdomain });
    const { user: u, gym: g, accessToken, refreshToken } = res.data.data;
    tokenStorage.accessToken = accessToken;
    tokenStorage.refreshToken = refreshToken;
    setUser(u);
    setGym(g);
    return { user: u, gym: g };
  }

  async function registerGym(data) {
    const res = await api.post('/auth/register-gym', data);
    const { user: u, gym: g, accessToken, refreshToken } = res.data.data;
    tokenStorage.accessToken = accessToken;
    tokenStorage.refreshToken = refreshToken;
    setUser(u);
    setGym(g);
    return { user: u, gym: g };
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // ignore
    }
    tokenStorage.clear();
    setUser(null);
    setGym(null);
  }

  async function refreshMe() {
    const r = await api.get('/auth/me');
    setUser(r.data.data.user);
    setGym(r.data.data.gym);
  }

  return (
    <AuthContext.Provider
      value={{ user, gym, loading, login, registerGym, logout, refreshMe, setGym }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
