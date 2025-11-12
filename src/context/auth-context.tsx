'use client';

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User as AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import type { User as FirebaseUser } from 'firebase/auth';


interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password?: string) => void;
  verifyOtp: (otp: string) => void;
  signInWithGoogle: () => void;
  logout: () => void;
  loading: boolean;
  authStep: string;
  currentUsername: string | null;
  resetAuthStep: () => void;
  isGoogleAuthd: boolean;
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
    router.push('/');
  }, [router]);


  return (
    <AuthContext.Provider value={{ 
        user, 
        firebaseUser: null,
        login, 
        logout, 
        loading, 
        // The following are now placeholders and not used in the simplified flow
        verifyOtp: () => {},
        signInWithGoogle: () => {},
        authStep: 'credentials',
        currentUsername: null,
        resetAuthStep: () => {},
        isGoogleAuthd: false
    }}>
      {children}
    </AuthContext.Provider>
  );
}
