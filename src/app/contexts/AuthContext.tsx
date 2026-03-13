import React, { createContext, useContext, useState, useEffect } from 'react';
import { registerWithEmail } from '../lib/auth';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (data: { user: User; access_token: string }) => void;
  register: (data: { name: string; email: string; password: string }) => Promise<{ user: User; access_token: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'gp_access_token';
const USER_KEY = 'gp_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize from localStorage on mount
    const storedToken = localStorage.getItem(TOKEN_KEY);
  const storedUser = localStorage.getItem(USER_KEY);

  if (storedToken && storedUser) {
    try {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } catch (e) {
      // Clear invalid data
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
  }

    setLoading(false);
  }, []);

  const login = (data: { user: User; access_token: string }) => {
    const { user: userData, access_token } = data;

    // Write to localStorage
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));

    // Update state
    setUser(userData);
    setToken(access_token);
  };

  const register = async (data: { name: string; email: string; password: string }) => {
    setLoading(true);

    try {
      const result = await registerWithEmail({ name, email, password });
      const { user: userData, access_token } = result;

      // Write to localStorage
      localStorage.setItem(TOKEN_KEY, access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));

      // Update state
      setUser(userData);
      setToken(access_token);
    } catch (error) {
      console.error('Register failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    // Clear state
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
