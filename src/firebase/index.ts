
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * MANDI MONITOR - DETACHED INITIALIZATION
 * This logic ensures the app never crashes if the Firebase URL is suspended or offline.
 * It favors local IndexedDB storage over network connectivity for launch stability.
 */
export function initializeFirebase() {
  try {
    if (typeof window === 'undefined') {
        return { firebaseApp: null as any, auth: null as any, firestore: null as any };
    }

    // Force Standalone Detachment
    if (!getApps().length) {
      let firebaseApp;
      try {
        // Detect connectivity and config validity
        if (firebaseConfig && firebaseConfig.apiKey && navigator.onLine) {
          firebaseApp = initializeApp(firebaseConfig);
          console.log("Mandi Monitor: Cloud Sync Active.");
        } else {
          console.log("Mandi Monitor: 100% Local-Only Mode Active.");
          return { firebaseApp: null as any, auth: null as any, firestore: null as any };
        }
      } catch (e) {
        // SILENT FALLBACK: If URL is suspended, proceed using internal database only
        console.warn("Mandi Monitor: Firebase detached. Using local storage.");
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
    // Total detachment: ensure app starts even if server is deleted
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
