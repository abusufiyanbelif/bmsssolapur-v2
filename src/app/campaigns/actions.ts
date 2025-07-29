
"use server";

import { getAllLeads, Lead } from "@/services/lead-service";
import { query, collection, where, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";

/**
 * Fetches leads that are verified and not yet closed.
 * These are the leads that should be displayed publicly for donations.
 */
export async function getOpenLeads(): Promise<Lead[]> {
    try {
        const leadsCollection = collection(db, 'leads');
        // We need to create a composite index for this query in Firestore.
        // The error message in the Firebase console will guide you.
        // It will look something like: verifiedStatus ASC, status ASC
        const q = query(
            leadsCollection, 
            where("verifiedStatus", "==", "Verified"),
            where("status", "!=", "Closed")
        );
        
        const querySnapshot = await getDocs(q);
        const leads: Lead[] = [];
        querySnapshot.forEach((doc) => {
            leads.push({ id: doc.id, ...doc.data() } as Lead);
        });

        // Sort by most recently created first
        leads.sort((a, b) => b.dateCreated.toMillis() - a.dateCreated.toMillis());

        return leads;
    } catch (error) {
        console.error("Error fetching open leads: ", error);
        // It's likely the composite index is missing. Log a helpful message.
        if (error instanceof Error && error.message.includes('requires an index')) {
            console.error("Firestore composite index missing. Please create a composite index on 'leads' collection with 'verifiedStatus' (ascending) and 'status' (ascending).");
        }
        // Return an empty array or rethrow, depending on desired error handling.
        return [];
    }
}
