

"use server";

import type { Lead, User, Campaign } from "@/services/types";
import { query, collection, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db, isConfigValid } from "@/services/firebase";
import { getUser } from "@/services/user-service";
import { getAllCampaigns as getAllCampaignsService } from "@/services/campaign-service";

export interface EnrichedLead extends Lead {
    beneficiary?: User;
}

/**
 * Fetches leads that are verified, open, AND are NOT linked to any campaign.
 * These are the general leads that should be displayed publicly for donations.
 */
export async function getOpenGeneralLeads(): Promise<EnrichedLead[]> {
    if (!isConfigValid) {
        console.warn("Firebase is not configured. Skipping fetching open leads.");
        return [];
    }
    try {
        const leadsCollection = collection(db, 'leads');
        
        // This query fetches all open/verified leads and we filter client-side.
        // A more scalable solution would be to add a flag like `isGeneralCase` during lead creation.
        const q = query(
            leadsCollection, 
            where("verifiedStatus", "==", "Verified"),
            where("status", "in", ["Pending", "Partial"])
        );
        
        const querySnapshot = await getDocs(q);

        const leads: Lead[] = [];
        querySnapshot.forEach((doc) => {
            const leadData = doc.data() as Omit<Lead, 'id'>;
            // Filter for leads that do NOT have a campaignId
            if (!leadData.campaignId) {
                leads.push({ id: doc.id, ...leadData });
            }
        });
        
        leads.sort((a, b) => b.dateCreated.toMillis() - a.dateCreated.toMillis());

        const enrichedLeads = await Promise.all(
            leads.map(async (lead) => {
                const beneficiary = await getUser(lead.beneficiaryId);
                return { ...lead, beneficiary };
            })
        );

        return enrichedLeads;
    } catch (error) {
        console.error("Error fetching open general leads: ", error);
        if (error instanceof Error && error.message.includes('requires an index')) {
            console.error("Firestore composite index missing. Please create one on 'leads' for 'verifiedStatus' (asc) and 'status' (in).");
        }
        return [];
    }
}


/**
 * Fetches all active and upcoming campaigns.
 * @returns An array of Campaign objects.
 */
export async function getActiveCampaigns(): Promise<Campaign[]> {
    if (!isConfigValid) {
        console.warn("Firebase is not configured. Skipping fetching active campaigns.");
        return [];
    }
    try {
        const allCampaigns = await getAllCampaignsService();
        // Filter for campaigns that are not completed or cancelled.
        return allCampaigns.filter(c => c.status === 'Active' || c.status === 'Upcoming');
    } catch (error) {
        console.error("Error fetching active campaigns: ", error);
        return [];
    }
}

