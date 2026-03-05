'use client';

import { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { useRouter } from 'next/navigation';
import type { User as AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password?: string) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const hardcodedUsers: Record<string, { user: AppUser; password?: string }> = {
  'admin@example.com': { user: { id: 'admin-uid', name: 'Admin User', role: 'admin' }, password: 'admin' },
  'user@example.com': { user: { id: 'user-uid', name: 'Regular User', role: 'user' }, password: 'user' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('mandi-monitor-user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = useCallback((email: string, password?: string) => {
    const userData = hardcodedUsers[email];
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
        description: 'Invalid email or password.',
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
