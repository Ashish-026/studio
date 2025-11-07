'use client';

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  login: (data: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const hardcodedUsers: Record<string, User> = {
  admin: { id: '1', name: 'Admin User', role: 'admin' },
  user: { id: '2', name: 'Regular User', role: 'user' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('mandi-monitor-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('mandi-monitor-user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (data: any) => {
    const { username, password } = data;
    if (password !== 'password') {
      toast({
        title: 'Login Failed',
        description: 'Invalid username or password.',
        variant: 'destructive',
      });
      return;
    }
    const foundUser = hardcodedUsers[username];
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('mandi-monitor-user', JSON.stringify(foundUser));
      router.push('/dashboard');
      toast({
        title: 'Login Successful',
        description: `Welcome, ${foundUser.name}!`,
      });
    } else {
      toast({
        title: 'Login Failed',
        description: 'Invalid username or password.',
        variant: 'destructive',
      });
    }
  }, [router, toast]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('mandi-monitor-user');
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
