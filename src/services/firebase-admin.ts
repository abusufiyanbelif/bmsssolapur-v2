
import * as admin from 'firebase-admin';
import { getFirestore as getAdminFirestore, Firestore as AdminFirestore } from 'firebase-admin/firestore';

let adminDbInstance: AdminFirestore;

const initializeFirebaseAdmin = () => {
    if (admin.apps.length === 0) {
        try {
            console.log("Initializing Firebase Admin SDK...");
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: 'baitul-mal-connect',
            });
            console.log('Firebase Admin SDK initialized successfully for project: baitul-mal-connect');
        } catch (e) {
            console.error("Firebase Admin SDK initialization error:", e);
            // Re-throw the error to be caught by the calling function
            throw new Error("Failed to initialize Firebase Admin SDK. Check server logs.");
        }
    }
    // Memoize the db instance after initialization
    if (!adminDbInstance) {
       adminDbInstance = getAdminFirestore();
    }
};

// Use a getter to ensure initialization happens before first use
export const getAdminDb = (): AdminFirestore => {
    if (!adminDbInstance) {
        initializeFirebaseAdmin();
    }
    return adminDbInstance;
};

// Export a direct instance for convenience, which will be lazily initialized
export const adminDb: AdminFirestore = new Proxy({} as AdminFirestore, {
    get: (target, prop) => {
        if (!adminDbInstance) {
            initializeFirebaseAdmin();
        }
        // Forward the property access to the actual db instance
        return Reflect.get(adminDbInstance, prop);
    }
});
