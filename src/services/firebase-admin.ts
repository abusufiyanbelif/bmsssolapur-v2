/**
 * @fileOverview Initializes the Firebase Admin SDK.
 * This file is carefully constructed to have NO internal project dependencies
 * to prevent circular import issues.
 */

import admin from 'firebase-admin';
import { getFirestore as getAdminFirestore, Firestore as AdminFirestore, Timestamp } from 'firebase-admin/firestore';
import type { User } from './types'; // We can safely import types

let adminDbInstance: AdminFirestore | null = null;
let adminAuthInstance: admin.auth.Auth | null = null;

// A promise that resolves when initialization is complete. This prevents race conditions.
let initializationPromise: Promise<void> | null = null;

/**
 * Ensures a system user exists in the database.
 * @param db The Firestore admin instance.
 * @param userData The user data to check for and create if absent.
 */
const ensureSystemUserExists = async (db: AdminFirestore, userData: Partial<User>) => {
    try {
        // Use the intended document ID directly for system users
        const userRef = db.collection('users').doc(userData.userId!);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.log(`Default system user "${userData.userId}" not found. Creating it now...`);
            
            const userCountSnapshot = await db.collection('users').count().get();
            const userKey = `SYSTEM${(userCountSnapshot.data().count + 1).toString().padStart(2, '0')}`;
            
            const userToCreate: Omit<User, 'id'> = {
                ...userData,
                password: userData.password, 
                userKey: userKey,
                createdAt: Timestamp.now() as any,
                updatedAt: Timestamp.now() as any,
            } as Omit<User, 'id'>;

            await userRef.set(userToCreate);
            console.log(`Default system user "${userData.userId}" created successfully.`);
        }
    } catch (e) {
        console.error(`CRITICAL ERROR: Failed to ensure system user "${userData.userId}" exists.`, e);
    }
};

export const CORE_COLLECTIONS = [
    'users', 'leads', 'donations', 'campaigns', 'activityLog',
    'settings', 'organizations', 'publicLeads', 'publicCampaigns',
    'publicData', 'inspirationalQuotes'
];

/**
 * Checks if a single Firestore collection exists, and creates it with a placeholder
 * document if it doesn't. This prevents errors on fresh deployments.
 * @param collectionName The name of the collection to check.
 * @returns An object indicating if the collection was created.
 */
export const ensureCollectionExists = async (collectionName: string): Promise<{ created: boolean }> => {
    const db = await getAdminDb();
    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef.limit(1).get();
    if (snapshot.empty) {
        console.log(`Collection "${collectionName}" not found. Creating it...`);
        await collectionRef.doc('_init_').set({
            initializedAt: Timestamp.now(),
            description: `This document was automatically created to initialize the ${collectionName} collection.`
        });
        return { created: true };
    }
    return { created: false };
};


const runPostInitTasks = async () => {
    if (!adminDbInstance) return;
    try {
        // Check all collections sequentially.
        for (const collectionName of CORE_COLLECTIONS) {
            await ensureCollectionExists(collectionName);
        }
        console.log("All essential collections verified.");
        
        await Promise.all([
             ensureSystemUserExists(adminDbInstance, {
                name: "admin",
                userId: "admin",
                firstName: "System",
                lastName: "Admin",
                fatherName: "System",
                email: "admin@example.com",
                phone: "9999999999",
                password: "password",
                roles: ["Super Admin"], 
                privileges: ["all"],
                isActive: true, 
                gender: 'Male', 
                source: 'Seeded',
            }),
            ensureSystemUserExists(adminDbInstance, {
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
            })
        ]);
    } catch(e) {
        console.error("A post-initialization task failed:", e);
    }
}

const initializeFirebaseAdmin = async () => {
  if (admin.apps.length > 0 && adminDbInstance) {
      return;
  }
  
  if (admin.apps.length === 0) {
    try {
      console.log("Initializing Firebase Admin SDK...");
      // Explicitly providing the project ID to ensure correct initialization in all environments.
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'baitul-mal-connect',
      });
      console.log('Firebase Admin SDK initialized successfully.');

      adminDbInstance = getAdminFirestore();
      adminAuthInstance = admin.auth();
      
      // CRITICAL: Await the post-init tasks to ensure collections/users are created before any other code runs.
      await runPostInitTasks();

    } catch (e) {
      console.error("Firebase Admin SDK initialization error:", e);
      throw new Error("Failed to initialize Firebase Admin SDK. Check server logs and credentials.");
    }
  } else if (admin.apps.length > 0 && !adminDbInstance) {
      adminDbInstance = getAdminFirestore();
      adminAuthInstance = admin.auth();
  }
};

const getInitializationPromise = () => {
    if (!initializationPromise) {
        initializationPromise = initializeFirebaseAdmin();
    }
    return initializationPromise;
};

export const getAdminDb = async (): Promise<AdminFirestore> => {
  await getInitializationPromise();
  if (!adminDbInstance) {
    throw new Error("getAdminDb called before async initialization completed. This is an application error.");
  }
  return adminDbInstance;
};

export const getAdminAuth = async (): Promise<admin.auth.Auth> => {
  await getInitializationPromise();
  if (!adminAuthInstance) {
     throw new Error("getAdminAuth called before async initialization completed. This is an application error.");
  }
  return adminAuthInstance;
};

// Immediately start the initialization process when the server starts.
getInitializationPromise();
