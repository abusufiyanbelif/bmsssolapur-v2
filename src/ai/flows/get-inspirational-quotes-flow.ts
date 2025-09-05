

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
            allQuotes = await getAllQuotes();
        } catch (error) {
            console.error("Error getting quotes from database, falling back to hardcoded list: ", error);
            allQuotes = [
                { id: '1', number: 1, text: "The believer's shade on the Day of Resurrection will be their charity.", source: "Tirmidhi", category: "Hadith", categoryTypeNumber: 2 },
                { id: '2', number: 2, text: "Charity does not decrease wealth.", source: "Sahih Muslim", category: "Hadith", categoryTypeNumber: 2 },
                { id: '3', number: 3, text: "And be steadfast in prayer and regular in charity: And whatever good ye send forth for your souls before you, ye shall find it with Allah.", source: "Quran 2:110", category: "Quran", categoryTypeNumber: 1 },
                { id: '4', number: 1, text: "A man's true wealth is the good he does in this world.", source: "Imam Ali (RA)", category: "Scholar", categoryTypeNumber: 3 },
            ];
        }
        
        const quranQuotes = allQuotes.filter(q => q.category === 'Quran');
        const hadithQuotes = allQuotes.filter(q => q.category === 'Hadith');
        const scholarQuotes = allQuotes.filter(q => q.category === 'Scholar');

        const selectedQuotes: Quote[] = [];

        if (quranQuotes.length > 0) {
            selectedQuotes.push(quranQuotes[Math.floor(Math.random() * quranQuotes.length)]);
        }
        if (hadithQuotes.length > 0) {
            selectedQuotes.push(hadithQuotes[Math.floor(Math.random() * hadithQuotes.length)]);
        }
        if (scholarQuotes.length > 0) {
            selectedQuotes.push(scholarQuotes[Math.floor(Math.random() * scholarQuotes.length)]);
        }

        return selectedQuotes;
    }
);

export async function getInspirationalQuotes(count: number = 3): Promise<Quote[]> {
    return await getInspirationalQuotesFlow({count});
}
