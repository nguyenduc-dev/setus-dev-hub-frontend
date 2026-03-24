'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Loader from '@/components/Loader';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (password: string, username: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'setus_auth_session';
const APP_PASSWORD = 'setusstudio';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        try {
          const session = JSON.parse(stored);
          const today = new Date().toISOString().split('T')[0];
          
          if (session.authenticated && session.date === today) {
            setIsAuthenticated(true);
            setUsername(session.username || 'Anonymous');
          } else {
            localStorage.removeItem(AUTH_KEY);
          }
        } catch (e) {
          localStorage.removeItem(AUTH_KEY);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (password: string, username: string) => {
    if (password === APP_PASSWORD && username.trim()) {
      const today = new Date().toISOString().split('T')[0];
      const session = { authenticated: true, date: today, username: username.trim() };
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      setIsAuthenticated(true);
      setUsername(username.trim());
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setUsername(null);
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
