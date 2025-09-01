
'use server';

import { adminDb } from '@/services/firebase-admin';

/**
 * Performs a lightweight, low-cost read operation against Firestore using the Admin SDK
 * to check if the current environment has the necessary permissions.
 * This function is designed to be called from a server-side context.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function performPermissionCheck(): Promise<{success: boolean, error?: string}> {
    try {
        // Attempt to access a non-existent document. This is a lightweight operation.
        const nonExistentDocRef = adminDb.collection("permission-check").doc("heartbeat");
        await nonExistentDocRef.get();
        return { success: true };
    } catch (e) {
        if (e instanceof Error) {
            // Specifically check for the default credentials error message.
            if (e.message.includes("Could not load the default credentials")) {
                 return { success: false, error: 'permission-denied' };
            }
            // Check for network errors (e.g., running offline).
             if (e.message.includes("offline")) {
                return { success: false, error: "The client is offline." };
            }
        }
        console.error("An unexpected error occurred during permission check:", e);
        return { success: false, error: "An unexpected error occurred during the initial permission check." };
    }
};
