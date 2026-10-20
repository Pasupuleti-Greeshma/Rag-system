import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { ApiClient } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const token = localStorage.getItem('smartdocs_token');
        if (token) {
          const res = await ApiClient.getMe();
          setUser(res.user);
        }
      } catch (err) {
        ApiClient.clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadCurrentUser();
  }, []);

  const login = (token: string, userData: User) => {
    ApiClient.setToken(token);
    setUser(userData);
  };

  const logout = () => {
    ApiClient.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
