

"use server";

import type { Lead, User, Campaign } from "@/services/types";
import { isConfigValid } from "@/services/firebase";
import { getPublicCampaigns } from "@/services/public-data-service";


export interface EnrichedLead extends Lead {
    beneficiary?: User;
}


/**
 * Fetches all campaigns regardless of status and enriches them with stats.
 * @returns An array of Campaign objects with `raisedAmount` and `fundingProgress`.
 */
export async function getAllCampaigns(): Promise<(Campaign & { raisedAmount: number, fundingProgress: number })[]> {
    if (!isConfigValid) {
        console.warn("Firebase not configured. Skipping fetching active campaigns.");
        return [];
    }
    try {
        // This now correctly fetches from the public, sanitized collection.
        const publicCampaigns = await getPublicCampaigns();
        
        return publicCampaigns.map(c => ({
            ...c,
            // Ensure fields from the original Campaign type exist if needed elsewhere, even if empty
            acceptableDonationTypes: c.acceptableDonationTypes || [],
            createdAt: c.createdAt || new Date(),
            updatedAt: c.updatedAt || new Date(),
        }));
    } catch (error) {
        console.error("Error fetching all campaigns with stats: ", error);
        return [];
    }
}
