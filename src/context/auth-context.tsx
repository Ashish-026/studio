'use client';

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User as AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

type AuthStep = 'google' | 'credentials' | 'otp';

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
  isGoogleAuthd: boolean;
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
  const [authStep, setAuthStep] = useState<AuthStep>('google');
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [isGoogleAuthd, setIsGoogleAuthd] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { auth } = initializeFirebase();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      // This listener now only manages the Google Auth state.
      // It does not log the user into the app on its own.
      if (fbUser) {
        setFirebaseUser(fbUser);
        const userEmail = fbUser.email;
        if (userEmail && authorizedUsers[userEmail]) {
          setIsGoogleAuthd(true);
          setAuthStep('credentials'); // Move to next step
        } else {
          setIsGoogleAuthd(false);
          toast({
            title: 'Authorization Failed',
            description: 'Your Google account is not authorized.',
            variant: 'destructive',
          });
          signOut(auth);
        }
      } else {
        setFirebaseUser(null);
        setIsGoogleAuthd(false);
        setUser(null);
        localStorage.removeItem('mandi-monitor-user');
        setAuthStep('google');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, toast]);

  const login = useCallback((username: string, password?: string) => {
    if (!isGoogleAuthd) {
        toast({ title: 'Login Error', description: 'Please sign in with Google first.', variant: 'destructive'});
        return;
    }

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
  }, [isGoogleAuthd, toast]);

  const verifyOtp = useCallback((otp: string) => {
     if (!isGoogleAuthd || authStep !== 'otp') {
        toast({ title: 'Login Error', description: 'Authentication sequence is incorrect.', variant: 'destructive'});
        return;
    }

    if (otp === MOCKED_OTP && currentUsername) {
      const userData = hardcodedUsers[currentUsername];
      if (userData) {
        // Final login step success
        const finalUser = {
            ...userData.user,
            id: firebaseUser?.uid || userData.user.id, // Use Firebase UID if available
            name: firebaseUser?.displayName || userData.user.name,
        };
        setUser(finalUser);
        localStorage.setItem('mandi-monitor-user', JSON.stringify(finalUser));
        router.push('/select-mill');
        toast({
          title: 'Login Successful',
          description: `Welcome, ${finalUser.name}!`,
        });
      }
    } else {
      toast({
        title: 'Login Failed',
        description: 'Invalid OTP.',
        variant: 'destructive',
      });
    }
  }, [currentUsername, router, toast, isGoogleAuthd, authStep, firebaseUser]);

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
    await signOut(auth); // This will trigger the onAuthStateChanged listener
    // The listener will then reset all states (firebaseUser, user, isGoogleAuthd, authStep)
    localStorage.removeItem('mandi-monitor-user');
    localStorage.removeItem('mandi-monitor-mill');
    router.push('/');
  }, [auth, router]);

  const resetAuthStep = () => {
    // This function is less relevant now as the flow is more rigid,
    // but can be used to go back from OTP to credentials.
    if(authStep === 'otp'){
        setAuthStep('credentials');
        setCurrentUsername(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, verifyOtp, signInWithGoogle, logout, loading, authStep, currentUsername, resetAuthStep, isGoogleAuthd }}>
      {children}
    </AuthContext.Provider>
  );
}
