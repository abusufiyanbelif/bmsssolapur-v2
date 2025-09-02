'use server';
/**
 * @fileOverview A Genkit flow for fetching inspirational quotes.
 *
 * - getInspirationalQuotes - A function that returns inspirational quotes.
 * - Quote - The type for a single quote object.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { Quote, QuoteSchema, QuotesOutput, QuotesOutputSchema } from '@/ai/schemas';
import { getRandomQuotes as getRandomQuotesService } from '@/services/quotes-service';

const getInspirationalQuotesFlow = ai.defineFlow(
    {
        name: 'getInspirationalQuotesFlow',
        inputSchema: z.object({ count: z.number().default(3) }),
        outputSchema: z.array(QuoteSchema),
    },
    async ({count}) => {
        return await getRandomQuotesService(count);
    }
);

export async function getInspirationalQuotes(count: number = 3): Promise<Quote[]> {
    return await getInspirationalQuotesFlow({count});
}
