
'use server';
/**
 * @fileOverview A Genkit flow for fetching a large batch of inspirational quotes for database seeding.
 *
 * - getBulkInspirationalQuotes - A function that returns a large array of inspirational quotes.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { Quote, QuotesOutput, QuotesOutputSchema } from '@/ai/schemas';

const prompt = ai.definePrompt({
    name: 'bulkInspirationalQuotesPrompt',
    input: { schema: z.object({}) }, // No input needed
    output: {schema: QuotesOutputSchema},
    prompt: `You are an expert in Islamic studies. Generate a list of at least 75 high-quality, inspirational quotes from Islamic teachings about charity, giving, compassion, justice, leadership, helping others, patience, and gratitude.

    For each quote, provide:
    1.  The full text of the quote.
    2.  The specific source (e.g., "Quran 2:274", "Sahih Muslim 1029", "Imam Shafi'i").
    3.  The category: 'Quran', 'Hadith', or 'Scholar'.

    Ensure a good mix of quotes from all three categories. The output must be a JSON object containing a 'quotes' array.`,
});

const bulkInspirationalQuotesFlow = ai.defineFlow(
    {
        name: 'bulkInspirationalQuotesFlow',
        inputSchema: z.object({}),
        outputSchema: QuotesOutputSchema,
    },
    async () => {
        const {output} = await prompt({});
        return output!;
    }
);

export async function getBulkInspirationalQuotes(): Promise<Quote[]> {
    const result = await bulkInspirationalQuotesFlow({});
    return result.quotes;
}
