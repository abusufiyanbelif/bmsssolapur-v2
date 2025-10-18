

'use server';

import { getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllUsers, updateUser as updateUserService, type User } from "@/services/user-service";
import { getPublicCampaigns as getPublicCampaignsService, getPublicLeads } from "@/services/public-data-service";
import type { Quote, Lead, Campaign, Donation } from '@/services/types';
import { getInspirationalQuotes } from "@/ai/flows/get-inspirational-quotes-flow";

export interface EnrichedLead extends Lead {
    beneficiary?: User;
}

interface PublicDashboardData {
    donations: Donation[];
    users: User[];
    leads: Lead[];
    campaigns: Campaign[];
    error?: string;
}

export async function getPublicDashboardData(): Promise<PublicDashboardData> {
    try {
        // Fetch all data necessary for public cards
        const [donations, users, leads, campaigns] = await Promise.all([
            getAllDonations(),
            getAllUsers(),
            getAllLeads(), // Use all leads for more accurate stats
            getPublicCampaignsService()
        ]);
        return {
            donations: JSON.parse(JSON.stringify(donations)),
            users: JSON.parse(JSON.stringify(users)),
            leads: JSON.parse(JSON.stringify(leads)),
            campaigns: JSON.parse(JSON.stringify(campaigns)),
        };
    } catch (error) {
        console.error("Error fetching public dashboard data:", error);
        return { donations: [], users: [], leads: [], campaigns: [], error: "Failed to load dashboard data." };
    }
}


export async function updateUser(userId: string, updates: Partial<User>) {
    return await updateUserService(userId, updates);
}

export async function getQuotes(count: number = 3): Promise<Quote[]> {
    try {
        const quotes = await getInspirationalQuotes(count);
        // The result from a server action to a client component must be serializable.
        return JSON.parse(JSON.stringify(quotes));
    } catch (error) {
        // This will now receive a proper error object with a message.
        console.warn("Server action getQuotes failed:", error instanceof Error ? error.message : error);
        // On failure, return an empty array. Do not return hardcoded data.
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
        return JSON.parse(JSON.stringify(leads));
    } catch (error) {
        console.error("Error fetching public leads:", error);
        return [];
    }
}

/**
 * Fetches all publicly visible campaigns.
 */
export async function getPublicCampaigns(): Promise<Campaign[]> {
    try {
        const campaigns = await getPublicCampaignsService();
        return JSON.parse(JSON.stringify(campaigns));
    } catch (error) {
        console.error("Error fetching public campaigns:", error);
        return [];
    }
}
