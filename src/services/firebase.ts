

import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { config as appConfig } from '@/lib/config';
import { adminDb } from './firebase-admin';

// --- Client-side Firebase SDK Initialization ---

const firebaseConfig = {
  apiKey: appConfig.firebase.apiKey,
  authDomain: appConfig.firebase.authDomain,
  projectId: appConfig.firebase.projectId,
  storageBucket: appConfig.firebase.storageBucket,
  messagingSenderId: appConfig.firebase.messagingSenderId,
  appId: appConfig.firebase.appId,
};

export const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let clientApp: FirebaseApp;
if (isConfigValid && !getApps().length) {
  clientApp = initializeApp(firebaseConfig);
} else {
  clientApp = getApps()[0];
}

const auth: Auth = getAuth(clientApp);
const db: Firestore = getFirestore(clientApp);
const storage = isConfigValid ? getStorage(clientApp) : null;


/**
 * Performs a lightweight, low-cost read operation against Firestore using the Admin SDK
 * to check if the current environment has the necessary permissions.
 * This function should be called from the server, typically in a root component.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const performPermissionCheck = async (): Promise<{success: boolean, error?: string}> => {
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


export { clientApp as app, auth, db, storage };
