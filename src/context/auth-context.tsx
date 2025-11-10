'use client';

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type AuthStep = 'credentials' | 'otp';

interface LoginCredentials {
  username: string;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  login: (data: LoginCredentials) => void;
  verifyOtp: (otp: string) => void;
  logout: () => void;
  loading: boolean;
  authStep: AuthStep;
  currentUsername: string | null;
  resetAuthStep: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const hardcodedUsers: Record<string, { user: User; password?: string }> = {
  admin: { user: { id: '1', name: 'Admin User', role: 'admin' }, password: 'admin' },
  user: { user: { id: '2', name: 'Regular User', role: 'user' }, password: 'user' },
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

  const login = useCallback((data: LoginCredentials) => {
    const { username, password } = data;
    const userData = hardcodedUsers[username];

    if (userData && (!userData.password || userData.password === password)) {
      setCurrentUsername(username);
      setAuthStep('otp');
      toast({
        title: 'OTP Sent',
        description: `Your OTP is: ${MOCKED_OTP}`,
      });
    } else {
      toast({
        title: 'Login Failed',
        description: 'Invalid username or password.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const verifyOtp = useCallback((otp: string) => {
    if (otp === MOCKED_OTP && currentUsername) {
      const userData = hardcodedUsers[currentUsername];
      if (userData) {
        setUser(userData.user);
        localStorage.setItem('mandi-monitor-user', JSON.stringify(userData.user));
        router.push('/select-mill'); // Changed from '/dashboard'
        toast({
          title: 'Login Successful',
          description: `Welcome, ${userData.user.name}!`,
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
