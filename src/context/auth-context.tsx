'use client';

import { createContext, useState, useEffect, useCallback, ReactNode, useMemo, useContext } from 'react';
import type { User as AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_CREDENTIALS = {
  admin: {
    email: 'admin@mill.com',
    password: 'password123',
    user: { id: 'admin-uid', name: 'Mill Owner', role: 'admin' as const }
  },
  user: {
    email: 'user@mill.com',
    password: 'staffpassword',
    user: { id: 'user-uid', name: 'Staff User', role: 'user' as const }
  }
};

interface AuthContextType {
  user: AppUser | null;
  credentials: typeof DEFAULT_CREDENTIALS;
  login: (email: string, password?: string) => void;
  logout: () => void;
  updateCredentials: (role: 'admin' | 'user', newEmail: string, newPassword?: string) => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const CREDENTIALS_KEY = 'mandi-monitor-credentials-v2';
const SESSION_KEY = 'mandi-monitor-session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [credentials, setCredentials] = useState(DEFAULT_CREDENTIALS);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedCreds = localStorage.getItem(CREDENTIALS_KEY);
    if (storedCreds) {
      try {
        setCredentials(JSON.parse(storedCreds));
      } catch (e) {
        console.error("Failed to load custom credentials", e);
      }
    }

    const sessionUser = sessionStorage.getItem(SESSION_KEY);
    if (sessionUser) {
      try {
        setUser(JSON.parse(sessionUser));
      } catch (e) {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((email: string, password?: string) => {
    const isAdmin = credentials.admin.email === email && credentials.admin.password === password;
    const isUser = credentials.user.email === email && credentials.user.password === password;
    
    if (isAdmin) {
      const u = credentials.admin.user;
      setUser(u);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
      toast({ title: 'Login Successful', description: `Welcome, ${u.name}!` });
    } else if (isUser) {
      const u = credentials.user.user;
      setUser(u);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
      toast({ title: 'Login Successful', description: `Welcome, ${u.name}!` });
    } else {
      toast({
        title: 'Login Failed',
        description: 'Incorrect email or password.',
        variant: 'destructive',
      });
    }
  }, [credentials, toast]);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
    toast({ title: 'Logged Out', description: 'Session closed successfully.' });
  }, [toast]);

  const updateCredentials = useCallback((role: 'admin' | 'user', newEmail: string, newPassword?: string) => {
    setCredentials(prev => {
      const updated = {
        ...prev,
        [role]: {
          ...prev[role],
          email: newEmail,
          password: newPassword || prev[role].password
        }
      };
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(updated));
      return updated;
    });
    toast({ title: 'Success', description: `${role.toUpperCase()} credentials updated successfully.` });
  }, [toast]);

  const contextValue = useMemo(() => ({
    user,
    credentials,
    login,
    logout,
    updateCredentials,
    loading
  }), [user, credentials, login, logout, updateCredentials, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
