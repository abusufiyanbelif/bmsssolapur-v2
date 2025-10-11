
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
            // If the database is empty (e.g., after an erase operation), return an empty array.
            if (allQuotes.length === 0) {
                return [];
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching quotes from the database.";
            console.error("Error within getInspirationalQuotesFlow:", errorMessage);
            // Re-throw a standard serializable error object so the server action can log it.
            throw new Error(errorMessage);
        }
        
        // Shuffle and return the requested number of quotes
        const shuffled = allQuotes.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
);

export async function getInspirationalQuotes(count: number = 3): Promise<Quote[]> {
    return await getInspirationalQuotesFlow({count});
}
