
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
        try {
            const allQuotes = await getAllQuotes();
            // If the database is empty or inaccessible, getAllQuotes now returns an empty array.
            if (allQuotes.length === 0) {
                return [];
            }
            
            // Shuffle and return the requested number of quotes
            const shuffled = allQuotes.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);

        } catch (error) {
            // This will now only catch unexpected errors from the service layer.
            console.error("Critical error in getInspirationalQuotesFlow. This should not happen if the service layer is working correctly.", error);
            // Re-throw a standard serializable error object so the server action can log it.
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error("An unknown error occurred while fetching quotes.");
        }
    }
);

export async function getInspirationalQuotes(count: number = 3): Promise<Quote[]> {
    return await getInspirationalQuotesFlow({count});
}
