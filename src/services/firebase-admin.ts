
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
 * Ensures the default 'admin' user exists in the database.
 * This is a critical function for production readiness, ensuring the app
 * always has a super admin without relying on manual seeding.
 * @param db The Firestore admin instance.
 */
const ensureAdminUserExists = async (db: AdminFirestore) => {
    try {
        const usersRef = db.collection('users');
        const q = usersRef.where('userId', '==', 'admin').limit(1);
        const snapshot = await q.get();

        if (snapshot.empty) {
            console.log("Default 'admin' user not found. Creating it now...");
            
            // Generate the user key. In a real scenario, this might need a more robust transaction.
            const userCountSnapshot = await usersRef.count().get();
            const userKey = `USR${(userCountSnapshot.data().count + 1).toString().padStart(2, '0')}`;

            const adminUser: Omit<User, 'id'> = {
                userKey: userKey,
                name: "admin",
                userId: "admin",
                firstName: "Admin",
                lastName: "User",
                fatherName: "System",
                email: "admin@example.com",
                phone: "9999999999",
                password: "password", // Default password, should be changed immediately in production
                roles: ["Super Admin"],
                privileges: ["all"],
                isActive: true,
                gender: 'Male',
                source: 'Seeded',
                createdAt: Timestamp.now() as any,
                updatedAt: Timestamp.now() as any,
            };

            // Use the hardcoded, predictable ID for the admin user document
            await usersRef.doc('ADMIN_USER_ID').set(adminUser);
            console.log("Default 'admin' user created successfully with ID 'ADMIN_USER_ID'.");
        }
    } catch (e) {
        console.error("CRITICAL ERROR: Failed to ensure admin user exists.", e);
        // We don't re-throw here to allow the app to attempt to continue running,
        // but this error should be treated as a major issue.
    }
};

const initializeFirebaseAdmin = async () => {
  if (admin.apps.length === 0) {
    try {
      console.log("Initializing Firebase Admin SDK...");
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

  // On the very first initialization of the server, check for the admin user.
  if (isFirstInit && adminDbInstance) {
    isFirstInit = false; // Ensure this only runs once per server start
    await ensureAdminUserExists(adminDbInstance);
  }
};

// Use getters to ensure initialization happens on first use.
export const getAdminDb = (): AdminFirestore => {
  if (!adminDbInstance) {
    // Note: We can't await here, but initializeApp is synchronous if not awaited.
    // The async check for the admin user will run in the background on first call.
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
