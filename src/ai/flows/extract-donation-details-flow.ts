
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
    
    - amount: The primary transaction amount. It must be a number.
    - transactionId: The Transaction ID, UTR, or any other reference number. It must be a string.
    - date: The date of the transaction. Format it as YYYY-MM-DD.
    - paymentMethod: The method of payment (e.g., UPI, Bank Transfer, GPay, PhonePe).
    - donorIdentifier: The name or UPI ID of the person who sent the money (e.g., 'john.doe@okbank' or 'John Doe'). This is a crucial field.
    
    If a field is not clearly visible in the screenshot, omit it from the output rather than guessing.

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
