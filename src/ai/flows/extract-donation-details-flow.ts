
'use server';
/**
 * @fileOverview A Genkit flow for extracting donation details from an image.
 *
 * - extractDonationDetails - A function that handles parsing a donation screenshot.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
    ExtractDonationDetailsInput,
    ExtractDonationDetailsInputSchema,
    ExtractDonationDetailsOutput,
    ExtractDonationDetailsOutputSchema
} from '@/ai/schemas';

export async function extractDonationDetails(input: ExtractDonationDetailsInput): Promise<ExtractDonationDetailsOutput> {
  return extractDonationDetailsFlow(input);
}


const prompt = ai.definePrompt({
    name: 'donationDetailsExtractorPrompt',
    input: { schema: ExtractDonationDetailsInputSchema },
    output: { schema: ExtractDonationDetailsOutputSchema },
    prompt: `You are an expert financial assistant. Analyze the provided image of a payment screenshot.
    Your task is to carefully extract the following details and return them in a structured JSON format:
    
    - amount: The primary transaction amount. It should be a number.
    - transactionId: The Transaction ID, UTR, or any other reference number. It should be a string.
    - date: The date of the transaction. Format it as YYYY-MM-DD.
    - paymentMethod: The method of payment (e.g., UPI, Bank Transfer).
    - donorIdentifier: The name of the sender or their UPI ID, if available.
    
    If a field is not visible in the screenshot, omit it from the output.

    Screenshot: {{media url=photoDataUri}}`
});


const extractDonationDetailsFlow = ai.defineFlow(
  {
    name: 'extractDonationDetailsFlow',
    inputSchema: ExtractDonationDetailsInputSchema,
    outputSchema: ExtractDonationDetailsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
