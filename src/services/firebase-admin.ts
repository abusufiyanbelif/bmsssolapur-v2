/**
 * @fileOverview Initializes the Firebase Admin SDK.
 * This file is carefully constructed to have NO internal project dependencies
 * to prevent circular import issues.
 */

import * as admin from 'firebase-admin';
import { getFirestore as getAdminFirestore, Firestore as AdminFirestore } from 'firebase-admin/firestore';

let adminDbInstance: AdminFirestore | null = null;
let adminAuthInstance: admin.auth.Auth | null = null;

const initializeFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    try {
      console.log("Initializing Firebase Admin SDK...");
      admin.initializeApp({
        // The SDK will automatically pick up the GOOGLE_APPLICATION_CREDENTIALS
        // environment variable or other default credentials.
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'baitul-mal-connect',
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (e) {
      console.error("Firebase Admin SDK initialization error:", e);
      // Re-throw a more user-friendly error to be caught by callers.
      throw new Error("Failed to initialize Firebase Admin SDK. Check server logs and credentials.");
    }
  }

  // Memoize the instances after initialization.
  if (!adminDbInstance) {
    adminDbInstance = getAdminFirestore();
  }
  if (!adminAuthInstance) {
    adminAuthInstance = admin.auth();
  }
};

// Use getters to ensure initialization happens on first use.
export const getAdminDb = (): AdminFirestore => {
  if (!adminDbInstance) {
    initializeFirebaseAdmin();
  }
  return adminDbInstance!;
};

export const getAdminAuth = (): admin.auth.Auth => {
  if (!adminAuthInstance) {
    initializeFirebaseAdmin();
  }
  return adminAuthInstance!;
};
