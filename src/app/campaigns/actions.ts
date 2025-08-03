

"use server";

import type { Lead, User } from "@/services/types";
import { query, collection, where, getDocs } from "firebase/firestore";
import { db, isConfigValid } from "@/services/firebase";
import { getUser } from "@/services/user-service";

export interface EnrichedLead extends Lead {
    beneficiary?: User;
}

/**
 * Fetches leads that are verified and not yet closed, and enriches them
 * with their corresponding beneficiary user data.
 * These are the leads that should be displayed publicly for donations.
 */
export async function getOpenLeads(): Promise<EnrichedLead[]> {
    if (!isConfigValid) {
        console.warn("Firebase is not configured. Skipping fetching open leads.");
        return [];
    }
    try {
        const leadsCollection = collection(db, 'leads');
        
        // Firestore does not support the '!=' (not equal) or 'in' operator for 'status' in this context.
        // We query for the statuses that mean the lead is "open".
        const q1 = query(
            leadsCollection, 
            where("verifiedStatus", "==", "Verified"),
            where("status", "in", ["Pending", "Partial"])
        );
        
        const querySnapshot = await getDocs(q1);

        const leads: Lead[] = [];
        querySnapshot.forEach((doc) => {
            leads.push({ id: doc.id, ...(doc.data() as Omit<Lead, 'id'>) });
        });
        
        // Sort by most recently created first
        leads.sort((a, b) => b.dateCreated.toMillis() - a.dateCreated.toMillis());

        // Enrich leads with beneficiary data
        const enrichedLeads = await Promise.all(
            leads.map(async (lead) => {
                const beneficiary = await getUser(lead.beneficiaryId);
                return { ...lead, beneficiary };
            })
        );

        return enrichedLeads;
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
