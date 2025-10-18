
'use server';

import type { Campaign } from "@/services/types";
import { isConfigValid } from "@/services/firebase";
import { getPublicCampaigns } from "@/services/public-data-service";


/**
 * Fetches all publicly visible campaigns.
 * This now fetches only active campaigns from the sanitized public collection.
 * @returns An array of Campaign objects with `raisedAmount` and `fundingProgress`.
 */
export async function getAllPublicCampaigns(): Promise<(Campaign & { raisedAmount: number, fundingProgress: number })[]> {
    if (!isConfigValid) {
        console.warn("Firebase not configured. Skipping fetching public campaigns.");
        return [];
    }
    try {
        const publicCampaigns = await getPublicCampaigns();
        
        return publicCampaigns.map(c => ({
            ...c,
            // Ensure fields from the original Campaign type exist if needed elsewhere, even if empty
            acceptableDonationTypes: c.acceptableDonationTypes || [],
            createdAt: c.createdAt || new Date(),
            updatedAt: c.updatedAt || new Date(),
        }));
    } catch (error) {
        console.error("Error fetching all public campaigns with stats: ", error);
        return [];
    }
}
