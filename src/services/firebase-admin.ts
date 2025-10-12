
/**
 * @fileOverview Initializes the Firebase Admin SDK.
 * This file is carefully constructed to have NO internal project dependencies
 * to prevent circular import issues.
 */

import * as admin from 'firebase-admin';
import { getFirestore as getAdminFirestore, Firestore as AdminFirestore, Timestamp } from 'firebase-admin/firestore';
import type { User } from './types'; // We can safely import types

let adminDbInstance: AdminFirestore | null = null;
let adminAuthInstance: admin.auth.Auth | null = null;

const initializeFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    try {
      console.log("Initializing Firebase Admin SDK using Application Default Credentials...");
      // In a Google Cloud environment (like App Hosting), this automatically uses
      // the runtime service account. For local dev, it uses gcloud auth application-default login credentials.
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'baitul-mal-connect',
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (e) {
      console.error("Firebase Admin SDK initialization error:", e);
      throw new Error("Failed to initialize Firebase Admin SDK. Check server logs and credentials.");
    }
  }

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

/**
 * Checks if essential Firestore collections exist, and creates them with a placeholder
 * document if they don't. This prevents errors on fresh deployments.
 * @returns An object with a list of created collections and any errors.
 */
export const ensureCollectionsExist = async (): Promise<{ success: boolean; created: string[]; errors: string[] }> => {
    const db = getAdminDb();
    const coreCollections = [
        'users', 'leads', 'donations', 'campaigns', 'activityLog',
        'settings', 'organizations', 'publicLeads', 'publicCampaigns',
        'publicData', 'inspirationalQuotes'
    ];

    console.log("Checking for essential Firestore collections...");
    
    const created: string[] = [];
    const errors: string[] = [];

    for (const collectionName of coreCollections) {
        try {
            const collectionRef = db.collection(collectionName);
            const snapshot = await collectionRef.limit(1).get();
            if (snapshot.empty) {
                console.log(`Collection "${collectionName}" not found. Creating it...`);
                // Add a placeholder document to create the collection.
                await collectionRef.doc('_init_').set({
                    initializedAt: Timestamp.now(),
                    description: `This document was automatically created to initialize the ${collectionName} collection.`
                });
                created.push(collectionName);
            }
        } catch (e) {
            const errorMsg = `CRITICAL ERROR: Failed to ensure collection "${collectionName}" exists.`;
            console.error(errorMsg, e);
            errors.push(errorMsg);
        }
    }
    
    return { success: errors.length === 0, created, errors };
};
