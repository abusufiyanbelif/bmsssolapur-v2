
'use server';

import { getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllUsers, updateUser as updateUserService, type User } from "@/services/user-service";
import { getPublicCampaigns, getPublicLeads } from "@/services/public-data-service";
import type { Quote, Lead } from '@/services/types';
import { getInspirationalQuotes } from "@/ai/flows/get-inspirational-quotes-flow";

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
        return {
            donations,
            users,
            leads,
            campaigns,
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
        const quotes = await getInspirationalQuotes(count);
        // The result from a server action to a client component must be serializable.
        // Genkit flows might return objects with non-serializable properties.
        return JSON.parse(JSON.stringify(quotes));
    } catch (error) {
        console.error("Server action getQuotes failed:", error);
        // Fallback to a simple list if service fails
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
