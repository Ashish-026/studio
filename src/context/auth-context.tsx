'use client';

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User as AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

type AuthStep = 'credentials' | 'otp';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  login: (username: string, password?: string) => void;
  verifyOtp: (otp: string) => void;
  signInWithGoogle: () => void;
  logout: () => void;
  loading: boolean;
  authStep: AuthStep;
  currentUsername: string | null;
  resetAuthStep: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const authorizedUsers: Record<string, { role: 'admin' | 'user' }> = {
  'user@example.com': { role: 'user' },
  'admin@example.com': { role: 'admin' },
};

const hardcodedUsers: Record<string, { user: AppUser; password?: string }> = {
  admin: { user: { id: '1', name: 'Admin User', role: 'admin' }, password: 'admin' },
  user: { user: { id: '2', name: 'Regular User', role: 'user' }, password: 'user' },
};

const MOCKED_OTP = '123456';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStep, setAuthStep] = useState<AuthStep>('credentials');
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { auth } = initializeFirebase();

  const handleAuthorization = useCallback(async (fbUser: FirebaseUser) => {
    const userEmail = fbUser.email;
    if (userEmail && authorizedUsers[userEmail]) {
      const appUser: AppUser = {
        id: fbUser.uid,
        name: fbUser.displayName || 'Unnamed User',
        role: authorizedUsers[userEmail].role,
      };
      setUser(appUser);
      setFirebaseUser(fbUser);
      localStorage.setItem('mandi-monitor-user', JSON.stringify(appUser));
      router.push('/select-mill');
    } else {
      toast({
        title: 'Authorization Failed',
        description: 'Your account is not authorized to access this application.',
        variant: 'destructive',
      });
      await signOut(auth);
    }
  }, [auth, router, toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        handleAuthorization(fbUser);
      } else {
        setUser(null);
        setFirebaseUser(null);
        localStorage.removeItem('mandi-monitor-user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, handleAuthorization]);


  const login = useCallback((username: string, password?: string) => {
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
        router.push('/select-mill');
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

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google sign-in error", error);
      toast({
        title: 'Sign-in Failed',
        description: 'Could not sign in with Google. Please try again.',
        variant: 'destructive'
      });
    }
  }, [auth, toast]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('mandi-monitor-user');
    localStorage.removeItem('mandi-monitor-mill');
    resetAuthStep();
    router.push('/');
  }, [auth, router]);

  const resetAuthStep = () => {
    setAuthStep('credentials');
    setCurrentUsername(null);
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, verifyOtp, signInWithGoogle, logout, loading, authStep, currentUsername, resetAuthStep }}>
      {children}
    </AuthContext.Provider>
  );
}
