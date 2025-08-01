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

const prompt = ai.definePrompt({
    name: 'inspirationalQuotesPrompt',
    input: { schema: z.object({ count: z.number().default(3) }) },
    output: {schema: QuotesOutputSchema},
    prompt: `You are a helpful assistant. Generate a list of exactly {{{count}}} inspirational quotes from Islamic teachings (Quran or Hadith) about charity, compassion, and helping others. For each quote, provide the text and the source.`,
});

const inspirationalQuotesFlow = ai.defineFlow(
    {
        name: 'inspirationalQuotesFlow',
        inputSchema: z.object({ count: z.number().default(3) }),
        outputSchema: QuotesOutputSchema,
    },
    async ({count}) => {
        const {output} = await prompt({count});
        return output!;
    }
);

export async function getInspirationalQuotes(count: number = 3): Promise<Quote[]> {
    const result = await inspirationalQuotesFlow({count});
    return result.quotes;
}
