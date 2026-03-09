'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * MANDI MONITOR - RESILIENT INITIALIZATION
 * Completely detached from server status. If Firebase project is suspended,
 * the app continues in "Local-Independent" mode without crashing.
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
        // We ensure we only initialize if the config looks valid.
        if (firebaseConfig && firebaseConfig.apiKey) {
          firebaseApp = initializeApp(firebaseConfig);
        } else {
          throw new Error("No config available");
        }
      } catch (e) {
        // SILENT FALLBACK: Returns empty SDKs to allow local storage usage only
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
    // If the Firebase Account is deleted or URL is 404, we load locally.
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
