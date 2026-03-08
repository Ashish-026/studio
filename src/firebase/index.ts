
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * MANDI MONITOR - RESILIENT INITIALIZATION
 * This function is designed to fail silently. 
 * Even if the Firebase account is deleted or the config is invalid, 
 * the app's local-first logic will continue to run.
 */
export function initializeFirebase() {
  try {
    if (!getApps().length) {
      let firebaseApp;
      try {
        // Attempt to initialize via Firebase App Hosting environment variables
        firebaseApp = initializeApp();
      } catch (e) {
        // Fallback to config object
        firebaseApp = initializeApp(firebaseConfig);
      }
      return getSdks(firebaseApp);
    }
    return getSdks(getApp());
  } catch (err) {
    // If the Firebase Account is deleted, initializeApp will fail.
    // We log a warning but do not crash the app, as it is local-first.
    console.warn("Firebase services unavailable. App is running in Local-Independent mode.", err);
    return {
      firebaseApp: null as any,
      auth: null as any,
      firestore: null as any
    };
  }
}

export function getSdks(firebaseApp: FirebaseApp) {
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
