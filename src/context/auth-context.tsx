'use client';

import { createContext, useState, useEffect, useCallback, ReactNode, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Load custom credentials from long-term memory
    const storedCreds = localStorage.getItem(CREDENTIALS_KEY);
    if (storedCreds) {
      try {
        setCredentials(JSON.parse(storedCreds));
      } catch (e) {
        console.error("Failed to load custom credentials", e);
      }
    }

    // SESSION LOGOUT LOGIC: Only check Session Storage. 
    // If user closes tab, Session Storage is wiped automatically by the browser.
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
      setUser(credentials.admin.user);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(credentials.admin.user));
      window.location.href = '/select-mill';
      toast({ title: 'Login Successful', description: `Welcome, ${credentials.admin.user.name}!` });
    } else if (isUser) {
      setUser(credentials.user.user);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(credentials.user.user));
      window.location.href = '/select-mill';
      toast({ title: 'Login Successful', description: `Welcome, ${credentials.user.user.name}!` });
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
    window.location.href = '/';
  }, []);

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
    login,
    logout,
    updateCredentials,
    loading
  }), [user, login, logout, updateCredentials, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
