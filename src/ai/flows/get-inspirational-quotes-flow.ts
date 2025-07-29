'use server';
/**
 * @fileOverview A Genkit flow for fetching inspirational quotes.
 *
 * - getInspirationalQuotes - A function that returns inspirational quotes.
 * - Quote - The type for a single quote object.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QuoteSchema = z.object({
  text: z.string().describe('The text of the quote.'),
  source: z.string().describe('The source of the quote (e.g., Quran, Hadith).'),
});
export type Quote = z.infer<typeof QuoteSchema>;

const QuotesOutputSchema = z.object({
  quotes: z.array(QuoteSchema).describe('An array of 3 to 10 inspirational quotes.'),
});
type QuotesOutput = z.infer<typeof QuotesOutputSchema>;


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
