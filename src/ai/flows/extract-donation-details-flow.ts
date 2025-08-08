

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
import { googleAI } from '@genkit-ai/googleai';


export async function extractDonationDetails(input: ExtractDonationDetailsInput): Promise<ExtractDonationDetailsOutput> {
  return extractDonationDetailsFlow(input);
}

const promptText = `You are an expert financial assistant specializing in parsing payment receipts. Analyze the provided image of a payment screenshot from apps like GPay, PhonePe, Paytm, etc., or a bank transfer confirmation.
    Your task is to carefully extract the following details. Be precise. If a field is not visible, omit it entirely from the output.

    - amount: The primary transaction amount. Must be a number.
    - transactionId: The main Transaction ID or Reference Number.
    - utrNumber: The UTR number, often a separate long number.
    - date: The date of the transaction. Format as YYYY-MM-DD.
    - time: The time of the transaction, e.g., "06:05 pm".
    - paymentApp: The app used (e.g., GPay, PhonePe, Paytm). Infer from the UI.
    - paymentMethod: The method used, like "UPI" or "Bank Transfer".
    - senderName: The full name of the person who sent the money.
    - senderAccountNumber: The sender's bank account number, even if partial (e.g., "...1234").
    - recipientName: The full name of the person who received the money.
    - recipientAccountNumber: The recipient's bank account number, even if partial.
    - recipientUpiId: The recipient's UPI ID.
    - status: The transaction status (e.g., Successful, Completed).
    - notes: Any user-added comments, remarks, or descriptions.
`;

const extractDonationDetailsFlow = ai.defineFlow(
  {
    name: 'extractDonationDetailsFlow',
    inputSchema: ExtractDonationDetailsInputSchema,
    outputSchema: ExtractDonationDetailsOutputSchema,
  },
  async (input) => {
    
    const llmResponse = await ai.generate({
        model: googleAI.model('gemini-1.5-flash-latest'),
        prompt: [
            { text: promptText },
            { media: { url: input.photoDataUri } }
        ],
        output: {
            schema: ExtractDonationDetailsOutputSchema
        }
    });
    
    const output = llmResponse.output;

    if (!output) {
      throw new Error("The AI model did not return any output. The image might be unreadable or of a non-payment type.");
    }
    
    // Check for essential fields and provide a specific error if they are missing.
    if (!output.amount || (!output.transactionId && !output.utrNumber)) {
        let missingFields = [];
        if (!output.amount) missingFields.push("Amount");
        if (!output.transactionId && !output.utrNumber) missingFields.push("Transaction ID or UTR");
        throw new Error(`Scan failed: Could not extract required fields (${missingFields.join(', ')}). Please try a clearer image or enter details manually.`);
    }

    return output;
  }
);
