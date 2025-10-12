
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

let isFirstInit = true;

/**
 * Ensures a system user exists in the database.
 * This is a critical function for production readiness, ensuring the app
 * always has critical system accounts without relying on manual seeding.
 * @param db The Firestore admin instance.
 * @param userData The user data to check for and create if absent.
 */
const ensureSystemUserExists = async (db: AdminFirestore, userData: Partial<User>) => {
    try {
        const usersRef = db.collection('users');
        const q = usersRef.where('userId', '==', userData.userId).limit(1);
        const snapshot = await q.get();

        if (snapshot.empty) {
            console.log(`Default system user "${userData.userId}" not found. Creating it now...`);
            
            // Generate the user key.
            const userCountSnapshot = await usersRef.count().get();
            const userKey = `SYSTEM${(userCountSnapshot.data().count + 1).toString().padStart(2, '0')}`;
            
            const userToCreate: Omit<User, 'id'> = {
                ...userData,
                userKey: userKey,
                createdAt: Timestamp.now() as any,
                updatedAt: Timestamp.now() as any,
            } as Omit<User, 'id'>;

            // Use the userId as the document ID for predictability
            await usersRef.doc(userData.userId!).set(userToCreate);
            console.log(`Default system user "${userData.userId}" created successfully.`);
        }
    } catch (e) {
        console.error(`CRITICAL ERROR: Failed to ensure system user "${userData.userId}" exists.`, e);
    }
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


const initializeFirebaseAdmin = async () => {
  if (admin.apps.length === 0) {
    try {
      console.log("Initializing Firebase Admin SDK...");
      admin.initializeApp({
        // Use application default credentials, which is the standard for both local (gcloud auth) and deployed Google Cloud environments.
        credential: admin.credential.applicationDefault(),
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

  // On the very first initialization of the server, check for critical system users and collections.
  if (isFirstInit && adminDbInstance) {
    isFirstInit = false; // Ensure this only runs once per server start
    
    // Auto-create essential collections
    await ensureCollectionsExist();
    
    // Auto-create the main 'admin' user
    await ensureSystemUserExists(adminDbInstance, {
        name: "admin",
        userId: "admin",
        firstName: "Admin",
        lastName: "User",
        fatherName: "System",
        email: "admin@example.com",
        phone: "9999999999",
        password: "password",
        roles: ["Super Admin"],
        privileges: ["all"],
        isActive: true,
        gender: 'Male',
        source: 'Seeded',
    });

    // Auto-create the 'anonymous_donor' user
    await ensureSystemUserExists(adminDbInstance, {
        name: "Anonymous Donor",
        userId: "anonymous_donor",
        firstName: "Anonymous",
        lastName: "Donor",
        email: "anonymous@system.local",
        phone: "0000000000",
        password: "N/A",
        roles: [],
        isActive: false,
        gender: 'Other',
        source: 'Seeded',
    });
  }
};

// Use getters to ensure initialization happens on first use.
export const getAdminDb = (): AdminFirestore => {
  if (!adminDbInstance) {
    // Note: We can't await here, but initializeApp is synchronous if not awaited.
    // The async checks for system users and collections will run in the background on first call.
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
