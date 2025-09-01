
// src/services/firebase.ts
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, getDoc, doc } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { config as appConfig } from '@/lib/config';
import dotenv from 'dotenv';

// Ensure dotenv is configured for server-side execution
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
let db: Firestore;
let auth: Auth;

if (typeof window === 'undefined') {
  // Server-side initialization
  try {
    // Attempt to initialize with service account credentials if available
    // In a real production environment, you would use environment variables
    // that are securely set by the hosting provider (like Firebase App Hosting)
    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    
    // Check if the essential service account keys are present
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        app = !getApps().length ? initializeApp({ ...firebaseConfig, serviceAccountId: serviceAccount.clientEmail }) : getApp();
    } else {
        // Fallback to default initialization if service account keys are missing
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    }
  } catch (e) {
      console.warn("Could not initialize Firebase Admin SDK. Falling back to default initialization. Error:", e);
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
} else {
  // Client-side initialization
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

db = getFirestore(app);
auth = getAuth(app);


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
