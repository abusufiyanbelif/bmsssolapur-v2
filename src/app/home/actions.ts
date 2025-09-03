

'use server';

import { getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllUsers, updateUser as updateUserService, type User } from "@/services/user-service";
import { getPublicCampaigns, getPublicLeads } from "@/services/public-data-service";
import { getAllQuotes } from "@/services/quotes-service";
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
        const allQuotes = await getAllQuotes();
        const shuffled = allQuotes.sort(() => 0.5 - Math.random());
        const selectedQuotes = shuffled.slice(0, count);
        return JSON.parse(JSON.stringify(selectedQuotes));
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

    