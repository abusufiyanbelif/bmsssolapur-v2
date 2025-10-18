
'use server';

import { getAdminDb } from '@/services/firebase-admin';
import { getUser as getUserService, type User } from '@/services/user-service';
import { getAllLeads as getAllLeadsService, type Lead } from '@/services/lead-service';
import { getAllDonations as getAllDonationsService, type Donation } from '@/services/donation-service';
import { extractRawTextFlow } from '@/ai/flows/extract-raw-text-flow';


/**
 * Fetches the current user's data from the database.
 * This server action is safe to call from client components. It includes
 * error handling for database connection issues.
 * @param userId The ID of the user to fetch.
 * @returns The user object or null if not found.
 * @throws An error if there's a critical database connectivity issue.
 */
export async function getCurrentUser(userId: string | null): Promise<User | null> {
    if (!userId) return null;
    try {
        const user = await getUserService(userId);
        // Ensure the returned object is serializable by converting Timestamps
        return user ? JSON.parse(JSON.stringify(user)) : null;
    } catch (error) {
        console.error("Error in getCurrentUser server action:", error);
        // Re-throw the error so the client-side can catch it and display a proper message
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unknown error occurred while fetching user data.");
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
