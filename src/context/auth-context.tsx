'use client';

import { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { useRouter } from 'next/navigation';
import type { User as AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

/**
 * ---------------------------------------------------------
 * CUSTOMIZE YOUR LOGIN DETAILS HERE
 * ---------------------------------------------------------
 * You can change the 'email' and 'password' below to 
 * whatever you like. 
 */
const INITIAL_CREDENTIALS: Record<string, { user: AppUser; password?: string }> = {
  // ADMIN ACCOUNT (Full access to Targets and Stock Transfers)
  'admin@mill.com': { 
    user: { id: 'admin-uid', name: 'Mill Owner', role: 'admin' }, 
    password: 'password123' 
  },
  // USER ACCOUNT (Limited to daily entry like lifting and labour)
  'user@mill.com': { 
    user: { id: 'user-uid', name: 'Staff User', role: 'user' }, 
    password: 'staffpassword' 
  },
};

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password?: string) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const stored = localStorage.getItem('mandi-monitor-user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = useCallback((email: string, password?: string) => {
    // Check against the hardcoded list at the top of this file
    const userData = INITIAL_CREDENTIALS[email];
    
    if (userData && (userData.password === password)) {
      setUser(userData.user);
      localStorage.setItem('mandi-monitor-user', JSON.stringify(userData.user));
      router.push('/select-mill');
      toast({
        title: 'Login Successful',
        description: `Welcome, ${userData.user.name}!`,
      });
    } else {
      toast({
        title: 'Login Failed',
        description: 'Incorrect email or password. Please check your credentials.',
        variant: 'destructive',
      });
    }
  }, [router, toast]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('mandi-monitor-user');
    localStorage.removeItem('mandi-monitor-mill');
    localStorage.removeItem('mandi-monitor-kms-year');
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
