

"use server";

import type { Lead, User, Campaign } from "@/services/types";
import { query, collection, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db, isConfigValid } from "@/services/firebase";
import { getUser } from "@/services/user-service";
import { getAllCampaigns as getAllCampaignsService } from "@/services/campaign-service";
import { getAllLeads } from "@/services/lead-service";
import { getPublicLeads, getPublicCampaigns } from "@/services/public-data-service";


export interface EnrichedLead extends Lead {
    beneficiary?: User;
}

/**
 * Fetches leads that are verified and public.
 * These are the general leads that should be displayed for donations.
 */
export async function getOpenGeneralLeads(): Promise<Lead[]> {
    if (!isConfigValid) {
        console.warn("Firebase is not configured. Skipping fetching open leads.");
        return [];
    }
    return getPublicLeads();
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
        const publicCampaigns = await getPublicCampaigns();
        
        // The public campaigns already have the stats pre-calculated.
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
