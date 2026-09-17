import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginRequest } from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import { clearAccessToken, getAccessToken, saveAccessToken } from './session';
import { isDemoMode } from '../config/runtime';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => isDemoMode() ? null : getAccessToken());

  const logout = useCallback(() => {
    clearAccessToken();
    setToken(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      navigate('/login', { replace: true, state: { sessionExpired: true } });
    });
    return () => setUnauthorizedHandler(null);
  }, [logout, navigate]);

  const login = useCallback(async (username: string, password: string) => {
    if (isDemoMode()) throw new Error('Вход отключён в demo-preview.');
    const response = await loginRequest(username, password);
    saveAccessToken(response.access_token);
    setToken(response.access_token);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated: Boolean(token), login, logout }),
    [login, logout, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
