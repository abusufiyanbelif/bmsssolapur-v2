

import * as admin from 'firebase-admin';
import { getFirestore as getAdminFirestore, Firestore as AdminFirestore } from 'firebase-admin/firestore';

const hasAdminBeenInitialized = () => {
    return admin.apps.length > 0;
};

if (!hasAdminBeenInitialized()) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: 'baitul-mal-connect', // Explicitly set the project ID
        });
        console.log('Firebase Admin SDK initialized successfully for project: baitul-mal-connect');
    } catch(e) {
        console.error("Firebase Admin SDK initialization error:", e);
    }
}

export const adminDb: AdminFirestore = getAdminFirestore();
