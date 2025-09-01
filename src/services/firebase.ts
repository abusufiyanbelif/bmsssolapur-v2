
// src/services/firebase.ts
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, getDoc, doc } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { config as appConfig } from '@/lib/config';
import dotenv from 'dotenv';

// Load environment variables. This is crucial for server-side execution.
dotenv.config();


const firebaseConfig = {
  apiKey: appConfig.firebase.apiKey,
  authDomain: appConfig.firebase.authDomain,
  projectId: appConfig.firebase.projectId,
  storageBucket: appConfig.firebase.storageBucket,
  messagingSenderId: appConfig.firebase.messagingSenderId,
  appId: appConfig.firebase.appId,
};

// A simple check to see if the config values are placeholders
const isConfigPotentiallyValid = (config: typeof firebaseConfig) => {
  if (!config.apiKey || config.apiKey.includes("YOUR_")) return false;
  if (!config.projectId || config.projectId.includes("YOUR_")) return false;
  return true;
}

// Check if all required firebase config values are present and not placeholders
export const isConfigValid = isConfigPotentiallyValid(firebaseConfig);

let app: FirebaseApp;

// This is the standard pattern for initializing Firebase in a Next.js app.
// It ensures that we don't try to re-initialize the app on every hot-reload.
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);


/**
 * Performs a lightweight, low-cost read operation against Firestore to check
 * if the current environment has the necessary permissions. This is used as an
 * upfront check to provide a better error message than the generic "Failed to fetch".
 * It tries to read a non-existent document, which is a very cheap operation.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const performPermissionCheck = async (): Promise<{success: boolean, error?: string}> => {
    if (!isConfigValid) {
        return { success: false, error: 'Firebase is not configured in your environment variables.' };
    }
    try {
        // Attempt to get a non-existent document in a non-existent collection.
        // This is a very low-cost operation and will fail immediately if rules are not set up.
        const nonExistentDocRef = doc(db, "permission-check", "heartbeat");
        await getDoc(nonExistentDocRef);
        return { success: true };
    } catch (e) {
        if (e instanceof Error) {
            if (e.message.includes("Missing or insufficient permissions")) {
                return { success: false, error: "permission-denied" };
            }
             if (e.message.includes("offline")) {
                return { success: false, error: "The client is offline." };
            }
        }
        // For other errors, we can let them bubble up or handle them differently
        console.error("An unexpected error occurred during permission check:", e);
        return { success: false, error: "An unexpected error occurred during the initial permission check." };
    }
};


export { app, db, auth };
