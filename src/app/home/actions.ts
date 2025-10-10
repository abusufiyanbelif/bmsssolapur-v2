

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
        // Genkit flows might return objects with non-serializable properties.
        return JSON.parse(JSON.stringify(quotes));
    } catch (error) {
        console.error("Server action getQuotes failed:", error);
        // Fallback to a simple list if service fails. The service layer will log specifics.
        return [
            { id: 'fb1', number: 1, text: "The believer's shade on the Day of Resurrection will be their charity.", source: "Tirmidhi", category: "Hadith", categoryTypeNumber: 2 },
            { id: 'fb2', number: 2, text: "Charity does not decrease wealth.", source: "Sahih Muslim", category: "Hadith", categoryTypeNumber: 2 },
            { id: 'fb3', number: 3, text: "And be steadfast in prayer and regular in charity: And whatever good ye send forth for your souls before you, ye shall find it with Allah.", source: "Quran 2:110", category: "Quran", categoryTypeNumber: 1 },
        ];
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
