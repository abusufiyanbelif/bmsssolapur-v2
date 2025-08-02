

"use server";

import { Lead } from "@/services/lead-service";
import { query, collection, where, getDocs, Timestamp } from "firebase/firestore";
import { db, isConfigValid } from "@/services/firebase";

/**
 * Fetches leads that are verified and not yet closed.
 * These are the leads that should be displayed publicly for donations.
 */
export async function getOpenLeads(): Promise<Lead[]> {
    if (!isConfigValid) {
        console.warn("Firebase is not configured. Skipping fetching open leads.");
        return [];
    }
    try {
        const leadsCollection = collection(db, 'leads');
        
        // Firestore does not support the '!=' (not equal) operator in queries in a way that
        // scales and can be automatically indexed. 
        // To get leads that are not 'Closed', we must query for the other statuses ('Pending' and 'Partial')
        // and merge the results.
        const q1 = query(
            leadsCollection, 
            where("verifiedStatus", "==", "Verified"),
            where("status", "==", "Pending")
        );
        const q2 = query(
            leadsCollection, 
            where("verifiedStatus", "==", "Verified"),
            where("status", "==", "Partial")
        );
        
        const [pendingSnapshot, partialSnapshot] = await Promise.all([
            getDocs(q1),
            getDocs(q2)
        ]);

        const leads: Lead[] = [];
        pendingSnapshot.forEach((doc) => {
            leads.push({ id: doc.id, ...(doc.data() as Omit<Lead, 'id'>) });
        });
        partialSnapshot.forEach((doc) => {
            leads.push({ id: doc.id, ...(doc.data() as Omit<Lead, 'id'>) });
        });

        // Sort by most recently created first
        leads.sort((a, b) => b.dateCreated.toMillis() - a.dateCreated.toMillis());

        return leads;
    } catch (error) {
        console.error("Error fetching open leads: ", error);
        // It's likely a composite index is missing if another error occurs.
        if (error instanceof Error && error.message.includes('requires an index')) {
            console.error("Firestore composite index missing. Please create a composite index on 'leads' collection with 'verifiedStatus' (ascending) and 'status' (ascending). The link in the error message will help you do this.");
        }
        // Return an empty array or rethrow, depending on desired error handling.
        return [];
    }
}
