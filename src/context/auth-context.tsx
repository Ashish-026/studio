'use client';

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type AuthStep = 'credentials' | 'otp';

interface AuthContextType {
  user: User | null;
  login: (data: { username: string }) => void;
  verifyOtp: (otp: string) => void;
  logout: () => void;
  loading: boolean;
  authStep: AuthStep;
  currentUsername: string | null;
  resetAuthStep: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const hardcodedUsers: Record<string, User> = {
  admin: { id: '1', name: 'Admin User', role: 'admin' },
  user: { id: '2', name: 'Regular User', role: 'user' },
};

const MOCKED_OTP = '123456';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStep, setAuthStep] = useState<AuthStep>('credentials');
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
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

  const login = useCallback((data: { username: string }) => {
    const { username } = data;
    const foundUser = hardcodedUsers[username];

    if (foundUser) {
      setCurrentUsername(username);
      setAuthStep('otp');
      toast({
        title: 'OTP Sent',
        description: `Your OTP is: ${MOCKED_OTP}`,
      });
    } else {
      toast({
        title: 'Login Failed',
        description: 'Invalid username.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const verifyOtp = useCallback((otp: string) => {
    if (otp === MOCKED_OTP && currentUsername) {
      const foundUser = hardcodedUsers[currentUsername];
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('mandi-monitor-user', JSON.stringify(foundUser));
        router.push('/select-mill'); // Changed from '/dashboard'
        toast({
          title: 'Login Successful',
          description: `Welcome, ${foundUser.name}!`,
        });
        resetAuthStep();
      }
    } else {
      toast({
        title: 'Login Failed',
        description: 'Invalid OTP.',
        variant: 'destructive',
      });
    }
  }, [currentUsername, router, toast]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('mandi-monitor-user');
    localStorage.removeItem('mandi-monitor-mill');
    resetAuthStep();
    router.push('/');
  }, [router]);

  const resetAuthStep = () => {
    setAuthStep('credentials');
    setCurrentUsername(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, verifyOtp, logout, loading, authStep, currentUsername, resetAuthStep }}>
      {children}
    </AuthContext.Provider>
  );
}
