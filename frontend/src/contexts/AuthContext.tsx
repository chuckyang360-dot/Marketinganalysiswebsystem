import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as api from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
  google_id: string | null;
  picture: string | null;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (data: { user: User; access_token: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedToken = api.getToken();
    const storedUser = api.getUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = (data: { user: User; access_token: string }) => {
    setToken(data.access_token);
    setUser(data.user);
    api.setToken(data.access_token);
    api.setUser(data.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    api.removeToken();
    api.removeUser();
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
