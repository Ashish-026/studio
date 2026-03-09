'use client';

import { createContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import type { User as AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';

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
    const loadAuth = async () => {
      try {
        // Use IndexedDB for more reliable storage in Standalone mode
        const storedCreds = await db.getItem<any>(CREDENTIALS_KEY);
        if (storedCreds && storedCreds.admin && storedCreds.user) {
          setCredentials(storedCreds);
        }

        const sessionUser = sessionStorage.getItem(SESSION_KEY);
        if (sessionUser) {
          try {
            setUser(JSON.parse(sessionUser));
          } catch (e) {
            sessionStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAuth();
  }, []);

  const login = useCallback((email: string, password?: string) => {
    if (!email || !password) {
        toast({ title: 'Missing Info', description: 'Please enter both email and password.', variant: 'destructive' });
        return;
    }

    // CASE-INSENSITIVE & ROBUST CHECKS
    const inputEmail = email.toLowerCase().trim();
    const inputPassword = password.trim();

    const isAdmin = credentials.admin.email.toLowerCase() === inputEmail && credentials.admin.password === inputPassword;
    const isUser = credentials.user.email.toLowerCase() === inputEmail && credentials.user.password === inputPassword;
    
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
        description: 'Incorrect email or password. Please check the Access Keys in Settings.',
        variant: 'destructive',
      });
    }
  }, [credentials, toast]);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
    toast({ title: 'Logged Out', description: 'Session closed successfully.' });
  }, [toast]);

  const updateCredentials = useCallback(async (role: 'admin' | 'user', newEmail: string, newPassword?: string) => {
    const updated = {
      ...credentials,
      [role]: {
        ...credentials[role],
        email: newEmail.toLowerCase().trim(),
        password: newPassword || credentials[role].password
      }
    };
    setCredentials(updated);
    await db.setItem(CREDENTIALS_KEY, updated);
    toast({ title: 'Success', description: `${role.toUpperCase()} credentials updated successfully.` });
  }, [credentials, toast]);

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
