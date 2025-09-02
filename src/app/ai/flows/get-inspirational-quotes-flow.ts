

'use server';
/**
 * @fileOverview A Genkit flow for fetching inspirational quotes.
 *
 * - getInspirationalQuotes - A function that returns inspirational quotes.
 * - Quote - The type for a single quote object.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { Quote, QuoteSchema } from '@/ai/schemas';
import { getAllQuotes } from '@/services/quotes-service';

const getInspirationalQuotesFlow = ai.defineFlow(
    {
        name: 'getInspirationalQuotesFlow',
        inputSchema: z.object({ count: z.number().default(3) }),
        outputSchema: z.array(QuoteSchema),
    },
    async ({count}) => {
        let allQuotes: Quote[] = [];
        try {
            // Try to fetch from the database
            allQuotes = await getAllQuotes();
            
        } catch (error) {
            // If any error occurs (e.g., connection failure), log it and fall back
            console.error("Error getting random quotes, falling back to hardcoded list: ", error);
            // This fallback is not ideal as it doesn't have IDs, but it prevents a crash.
            // In a real app, you might have a static JSON file for this.
            allQuotes = [
                { id: '1', number: 1, text: "The believer's shade on the Day of Resurrection will be their charity.", source: "Tirmidhi", category: "Hadith" },
                { id: '2', number: 2, text: "Charity does not decrease wealth.", source: "Sahih Muslim", category: "Hadith" },
                { id: '3', number: 1, text: "And be steadfast in prayer and regular in charity: And whatever good ye send forth for your souls before you, ye shall find it with Allah.", source: "Quran 2:110", category: "Quran" },
            ];
        }
        
        // Shuffle and return the requested number of quotes from the chosen list
        const shuffled = allQuotes.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
);

export async function getInspirationalQuotes(count: number = 3): Promise<Quote[]> {
    return await getInspirationalQuotesFlow({count});
}
