
'use server';

import { getAdminDb } from '@/services/firebase-admin';
import { getUser as getUserService, type User } from '@/services/user-service';
import { getAllLeads as getAllLeadsService, type Lead } from '@/services/lead-service';
import { getAllDonations as getAllDonationsService, type Donation } from '@/services/donation-service';


/**
 * Performs a lightweight, low-cost read operation against Firestore using the Admin SDK
 * to check if the current environment has the necessary permissions.
 * This function is designed to be called from a server-side context.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function performPermissionCheck(): Promise<{success: boolean, error?: string}> {
    try {
        const adminDb = getAdminDb();
        // Attempt to access a non-existent document. This is a lightweight operation.
        const nonExistentDocRef = adminDb.collection("permission-check").doc("heartbeat");
        await nonExistentDocRef.get();
        return { success: true };
    } catch (e) {
        if (e instanceof Error) {
            // Specifically check for the default credentials error message.
            if (e.message.includes("Could not load the default credentials") || e.message.includes("Could not refresh access token")) {
                 return { success: false, error: 'permission-denied' };
            }
             // Return the specific error message for other cases.
            return { success: false, error: e.message };
        }
        console.error("An unexpected error occurred during permission check:", e);
        return { success: false, error: "An unexpected error occurred during the initial permission check." };
    }
};

/**
 * A server action to securely fetch the current user's data.
 * This function is safe to be called from client components.
 * @param userId The ID of the user to fetch.
 * @returns The user object or null if not found.
 */
export async function getCurrentUser(userId: string | null): Promise<User | null> {
    if (!userId) return null;
    try {
        const user = await getUserService(userId);
        // Ensure the returned object is serializable by converting Timestamps
        return user ? JSON.parse(JSON.stringify(user)) : null;
    } catch (error) {
        console.error("Error in getCurrentUser server action:", error);
        return null;
    }
}

/**
 * A server action to securely fetch notification data for admins.
 * This function is safe to be called from client components.
 * @returns An object containing arrays of pending leads and donations.
 */
export async function getAdminNotificationData(): Promise<{ pendingLeads: Lead[], readyToPublishLeads: Lead[], pendingDonations: Donation[] }> {
    try {
        const [allLeads, allDonations] = await Promise.all([
            getAllLeadsService(),
            getAllDonationsService()
        ]);
        
        const pendingLeads = allLeads.filter(l => l.caseVerification === 'Pending');
        const readyToPublishLeads = allLeads.filter(l => l.caseAction === 'Ready For Help');
        const pendingDonations = allDonations.filter(d => d.status === 'Pending verification' || d.status === 'Pending');

        // Ensure data is serializable
        return { 
            pendingLeads: JSON.parse(JSON.stringify(pendingLeads)), 
            readyToPublishLeads: JSON.parse(JSON.stringify(readyToPublishLeads)),
            pendingDonations: JSON.parse(JSON.stringify(pendingDonations)) 
        };

    } catch (error) {
        console.error("Error fetching admin notification data:", error);
        return { pendingLeads: [], readyToPublishLeads: [], pendingDonations: [] };
    }
}

export const getRawTextFromImage = async (formData: FormData): Promise<{ success: boolean; rawText?: string; error?: string }> => {
    try {
        const { extractRawTextFlow } = await import('@/ai/flows/extract-raw-text-flow');

        const files = Array.from(formData.values()) as File[];
        if (files.length === 0) {
            return { success: false, error: 'No files were uploaded.' };
        }

        const dataUris = await Promise.all(files.map(file => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file);
            });
        }));

        const result = await extractRawTextFlow({ photoDataUris: dataUris });
        return { success: true, rawText: result.rawText };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred during text extraction.";
        console.error("Error in getRawTextFromImage server action:", error);
        return { success: false, error };
    }
};

