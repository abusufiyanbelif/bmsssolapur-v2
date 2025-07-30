'use server';
/**
 * @fileOverview A Genkit flow for fetching inspirational quotes based on user role.
 *
 * - getRoleBasedInspirationalQuotes - A function that returns inspirational quotes relevant to a user's role.
 * - RoleBasedQuotesInput - The input type for the flow.
 * - Quote - The type for a single quote object.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QuoteSchema = z.object({
  text: z.string().describe('The text of the quote.'),
  source: z.string().describe('The source of the quote (e.g., Quran, Hadith, Scholar).'),
});
export type Quote = z.infer<typeof QuoteSchema>;

const RoleBasedQuotesInputSchema = z.object({
  role: z.string().describe("The user's role (e.g., Donor, Admin, Beneficiary)."),
});
export type RoleBasedQuotesInput = z.infer<typeof RoleBasedQuotesInputSchema>;


const QuotesOutputSchema = z.object({
  quotes: z.array(QuoteSchema).describe('An array of exactly 3 inspirational quotes relevant to the user role.'),
});
type QuotesOutput = z.infer<typeof QuotesOutputSchema>;


const prompt = ai.definePrompt({
    name: 'roleBasedInspirationalQuotesPrompt',
    input: { schema: RoleBasedQuotesInputSchema },
    output: {schema: QuotesOutputSchema},
    prompt: `You are a helpful assistant specializing in Islamic teachings. Generate a list of exactly 3 inspirational quotes (from the Quran, Hadith, or notable Islamic Scholars) that are highly relevant to a user with the role of {{{role}}}.

- If the role is 'Donor', focus on the virtues of charity, giving, sadaqah, and zakat.
- If the role is 'Admin' or 'Finance Admin', focus on justice, fairness, responsibility, and leadership.
- If the role is 'Beneficiary', focus on patience (sabr), hope, gratitude (shukr), and trust in God's plan.
- For any other role, provide general inspirational quotes about community and good deeds.

For each quote, provide the text and the source.`,
});

const getRoleBasedInspirationalQuotesFlow = ai.defineFlow(
    {
        name: 'getRoleBasedInspirationalQuotesFlow',
        inputSchema: RoleBasedQuotesInputSchema,
        outputSchema: QuotesOutputSchema,
    },
    async ({role}) => {
        const {output} = await prompt({role});
        return output!;
    }
);

export async function getRoleBasedInspirationalQuotes(role: string): Promise<Quote[]> {
    const result = await getRoleBasedInspirationalQuotesFlow({role});
    return result.quotes;
}
