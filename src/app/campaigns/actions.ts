

"use server";

import type { Lead, User, Campaign } from "@/services/types";
import { query, collection, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db, isConfigValid } from "@/services/firebase";
import { getUser } from "@/services/user-service";
import { getAllCampaigns as getAllCampaignsService } from "@/services/campaign-service";
import { getAllLeads } from "@/services/lead-service";

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
        
        // This query fetches all open/verified leads that are meant for public viewing.
        const q = query(
            leadsCollection, 
            where("verifiedStatus", "==", "Verified"),
            where("status", "in", ["Publish", "Partial", "Ready For Help"])
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
 * Fetches all campaigns regardless of status and enriches them with stats.
 * @returns An array of Campaign objects with `raisedAmount` and `fundingProgress`.
 */
export async function getAllCampaigns(): Promise<(Campaign & { raisedAmount: number, fundingProgress: number })[]> {
    if (!isConfigValid) {
        console.warn("Firebase not configured. Skipping fetching active campaigns.");
        return [];
    }
    try {
        const [allCampaigns, allLeads] = await Promise.all([
            getAllCampaignsService(),
            getAllLeads()
        ]);
        
        // Calculate stats for each campaign
        const enrichedCampaigns = allCampaigns.map(campaign => {
            const linkedLeads = allLeads.filter(lead => lead.campaignId === campaign.id);
            const raisedAmount = linkedLeads.reduce((sum, lead) => sum + lead.helpGiven, 0);
            const fundingProgress = campaign.goal > 0 ? (raisedAmount / campaign.goal) * 100 : 0;
            
            return {
                ...campaign,
                raisedAmount,
                fundingProgress
            };
        });

        return enrichedCampaigns;
    } catch (error) {
        console.error("Error fetching all campaigns with stats: ", error);
        return [];
    }
}




