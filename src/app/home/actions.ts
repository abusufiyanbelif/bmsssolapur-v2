

'use server';

import { getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllUsers, updateUser as updateUserService, type User } from "@/services/user-service";
import { getPublicCampaigns, getPublicLeads } from "@/services/public-data-service";
import { getInspirationalQuotes as getQuotesFlow } from "@/ai/flows/get-inspirational-quotes-flow";
import type { Quote, Lead } from '@/services/types';

export interface EnrichedLead extends Lead {
    beneficiary?: User;
}

export async function getPublicDashboardData() {
    try {
        const [donations, users, leads, campaigns] = await Promise.all([
            getAllDonations(),
            getAllUsers(),
            getPublicLeads(), // Fetch public leads
            getPublicCampaigns()
        ]);
        // The data is automatically serialized when returned from a server action.
        // We need to handle the Date objects manually.
        return {
            donations: JSON.parse(JSON.stringify(donations)),
            users: JSON.parse(JSON.stringify(users)),
            leads: JSON.parse(JSON.stringify(leads)),
            campaigns: JSON.parse(JSON.stringify(campaigns)),
        };
    } catch (error) {
        console.error("Error fetching public dashboard data:", error);
        return { error: "Failed to load dashboard data." };
    }
}


export async function updateUser(userId: string, updates: Partial<User>) {
    return await updateUserService(userId, updates);
}

export async function getQuotes(count: number = 3): Promise<Quote[]> {
    try {
        const quotes = await getQuotesFlow(count);
        // The data is automatically serialized when returned from a server action, so this is safe.
        return quotes;
    } catch (error) {
        console.error("Server action getQuotes failed:", error);
        return [];
    }
}


/**
 * Fetches leads that are verified and public.
 * These are the general leads that should be displayed for donations.
 */
export async function getOpenGeneralLeads(): Promise<Lead[]> {
    try {
        const leads = await getPublicLeads();
        // The data is automatically serialized when returned from a server action.
        return JSON.parse(JSON.stringify(leads));
    } catch (error) {
        console.error("Error fetching public leads:", error);
        return [];
    }
}

    