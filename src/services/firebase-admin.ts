
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

// A promise that resolves when initialization is complete. This prevents race conditions.
let initializationPromise: Promise<void> | null = null;

/**
 * Ensures a system user exists in the database.
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
            
            const userCountSnapshot = await usersRef.count().get();
            const userKey = `SYSTEM${(userCountSnapshot.data().count + 1).toString().padStart(2, '0')}`;
            
            const userToCreate: Omit<User, 'id'> = {
                ...userData,
                userKey: userKey,
                createdAt: Timestamp.now() as any,
                updatedAt: Timestamp.now() as any,
            } as Omit<User, 'id'>;

            await usersRef.doc(userData.userId!).set(userToCreate);
            console.log(`Default system user "${userData.userId}" created successfully.`);
        }
    } catch (e) {
        console.error(`CRITICAL ERROR: Failed to ensure system user "${userData.userId}" exists.`, e);
    }
};

/**
 * Checks if essential Firestore collections exist and creates them if they don't.
 * @returns An object with a list of created collections and any errors.
 */
export const ensureCollectionsExist = async (): Promise<{ success: boolean; created: string[]; errors: string[], message?: string, details?: string[] }> => {
    const db = await getAdminDb(); // Use the async getter
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

    const message = created.length > 0 
        ? `Successfully created ${created.length} missing collection(s).` 
        : "All essential collections already exist.";
    const details = created.length > 0 ? [`Created: ${created.join(', ')}`] : [];
    
    return { success: errors.length === 0, created, errors, message, details };
};


const initializeFirebaseAdmin = async () => {
    // This function now handles only the core SDK initialization.
    if (admin.apps.length === 0) {
        try {
            console.log("Initializing Firebase Admin SDK...");
            admin.initializeApp({
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
    
    // The recursive calls are removed from here.
};


const runPostInitTasks = async () => {
    // This function is called once after initialization succeeds.
    if (!adminDbInstance) return;
    
    try {
        await Promise.all([
            ensureCollectionsExist(),
            ensureSystemUserExists(adminDbInstance, {
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

const getInitializationPromise = () => {
    if (!initializationPromise) {
        initializationPromise = initializeFirebaseAdmin().then(runPostInitTasks);
    }
    return initializationPromise;
};

// Use getters to ensure initialization happens on first use.
// This is now async to handle the initialization promise.
export const getAdminDb = async (): Promise<AdminFirestore> => {
  await getInitializationPromise();
  return adminDbInstance!;
};

export const getAdminAuth = async (): Promise<admin.auth.Auth> => {
  await getInitializationPromise();
  return adminAuthInstance!;
};
