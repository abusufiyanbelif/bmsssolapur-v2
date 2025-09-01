

import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import * as admin from 'firebase-admin';
import { getFirestore as getAdminFirestore, Firestore as AdminFirestore } from 'firebase-admin/firestore';
import { config as appConfig } from '@/lib/config';

// --- Client-side Firebase SDK Initialization ---

const firebaseConfig = {
  apiKey: appConfig.firebase.apiKey,
  authDomain: appConfig.firebase.authDomain,
  projectId: appConfig.firebase.projectId,
  storageBucket: appConfig.firebase.storageBucket,
  messagingSenderId: appConfig.firebase.messagingSenderId,
  appId: appConfig.firebase.appId,
};

const isConfigPotentiallyValid = (config: typeof firebaseConfig) => {
  return config.apiKey && config.projectId;
};

export const isConfigValid = isConfigPotentiallyValid(firebaseConfig);

let clientApp: FirebaseApp;
if (!getApps().length) {
  clientApp = initializeApp(firebaseConfig);
} else {
  clientApp = getApp();
}

const auth: Auth = getAuth(clientApp);
const db: Firestore = getFirestore(clientApp);
const storage = isConfigValid ? getStorage(clientApp) : null;

// --- Server-side Firebase Admin SDK Initialization ---

const hasAdminBeenInitialized = () => {
    return admin.apps.length > 0;
};

let adminDb: AdminFirestore;

if (!hasAdminBeenInitialized()) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
        console.log('Firebase Admin SDK initialized successfully.');
    } catch(e) {
        console.error("Firebase Admin SDK initialization error:", e);
    }
}

adminDb = getAdminFirestore();

/**
 * Performs a lightweight, low-cost read operation against Firestore using the Admin SDK
 * to check if the current environment has the necessary permissions.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const performPermissionCheck = async (): Promise<{success: boolean, error?: string}> => {
    if (!isConfigValid) {
        return { success: false, error: 'Firebase client config is missing or incomplete.' };
    }
    try {
        const nonExistentDocRef = adminDb.collection("permission-check").doc("heartbeat");
        await nonExistentDocRef.get();
        return { success: true };
    } catch (e) {
        if (e instanceof Error) {
            if (e.message.includes("Could not load the default credentials")) {
                 return { success: false, error: 'permission-denied' };
            }
             if (e.message.includes("offline")) {
                return { success: false, error: "The client is offline." };
            }
        }
        console.error("An unexpected error occurred during permission check:", e);
        return { success: false, error: "An unexpected error occurred during the initial permission check." };
    }
};

// Export both client and admin instances
export { clientApp as app, auth, db, adminDb, storage };
