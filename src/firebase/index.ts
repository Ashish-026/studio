'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * MANDI MONITOR - RESILIENT INITIALIZATION
 * This function is designed to fail silently if the server is unreachable.
 * If the Firebase project is suspended, the app switches to "Local-Only" mode automatically.
 */
export function initializeFirebase() {
  try {
    if (typeof window === 'undefined') {
        return { firebaseApp: null as any, auth: null as any, firestore: null as any };
    }

    if (!getApps().length) {
      let firebaseApp;
      try {
        // Attempt to connect. If the server is offline or project closed, this will throw.
        firebaseApp = initializeApp(firebaseConfig);
      } catch (e) {
        console.warn("Firebase Server Offline. Entering Local-Independent Mode.");
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
    // If the Firebase Account is deleted or URL is 404, we do not crash.
    // The app loads from the Service Worker cache and IndexedDB instead.
    console.warn("Project URL unreachable. Using Local-Only instance.", err);
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
