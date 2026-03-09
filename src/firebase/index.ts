'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * MANDI MONITOR - DETACHED INITIALIZATION
 * This logic ensures the app never crashes if the Firebase URL is suspended.
 * If server is offline, the app silently switches to "Local-First" mode.
 */
export function initializeFirebase() {
  try {
    if (typeof window === 'undefined') {
        return { firebaseApp: null as any, auth: null as any, firestore: null as any };
    }

    if (!getApps().length) {
      let firebaseApp;
      try {
        // Only attempt connection if config is valid and network might be present
        if (firebaseConfig && firebaseConfig.apiKey && navigator.onLine) {
          firebaseApp = initializeApp(firebaseConfig);
        } else {
          throw new Error("Working in Standalone Offline Mode");
        }
      } catch (e) {
        // SILENT FALLBACK: Proceed using internal mobile database (IndexedDB) only
        return {
          firebaseApp: null as any,
          auth: null as any,
          firestore: null as any
        };
      }
      return getSdks(firebaseApp);
    }
    return getSdks(getApp());
  } catch (err) {
    // Total detachment: ensure app starts even if Firebase account is deleted
    return {
      firebaseApp: null as any,
      auth: null as any,
      firestore: null as any
    };
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
