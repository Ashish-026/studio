'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * MANDI MONITOR - DETACHED INITIALIZATION
 * This logic is designed to be 100% resilient. It will never crash the app
 * if the Firebase URL is suspended or the device is offline.
 */
export function initializeFirebase() {
  const nullResult = { firebaseApp: null as any, auth: null as any, firestore: null as any };
  
  try {
    if (typeof window === 'undefined') {
        return nullResult;
    }

    // Attempt standard initialization but catch all failures
    if (!getApps().length) {
      try {
        if (firebaseConfig && firebaseConfig.apiKey) {
          const app = initializeApp(firebaseConfig);
          return {
            firebaseApp: app,
            auth: getAuth(app),
            firestore: getFirestore(app)
          };
        }
      } catch (e) {
        console.warn("Mandi Monitor: Cloud features suspended. Running in Standalone Local Mode.");
        return nullResult;
      }
    }
    return getSdks(getApp());
  } catch (err) {
    // Total detachment: ensure app starts even if server is completely offline
    return nullResult;
  }
}

export function getSdks(firebaseApp: FirebaseApp) {
  if (!firebaseApp) {
    return { firebaseApp: null as any, auth: null as any, firestore: null as any };
  }
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
