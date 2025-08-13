

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

const promptText = `You are an expert financial assistant specializing in parsing payment receipts from Indian payment apps. Analyze the provided image of a payment screenshot from apps like GPay, PhonePe, Paytm, etc.
Your task is to carefully extract the following details. Be precise. If a field is not visible, omit it entirely from the output.

- amount: The primary transaction amount. Must be a number.
- transactionId: The main Transaction ID or Reference Number. Use the "UPI transaction ID" if present.
- utrNumber: The UTR number, if it is explicitly labeled as such.
- date: The date of the transaction. Format as YYYY-MM-DD.
- time: The time of the transaction, e.g., "11:48 am".
- paymentApp: The app used (e.g., GPay, PhonePe, Paytm). Infer from the UI.
- paymentMethod: The method used, like "UPI" or "Bank Transfer".
- senderName: The full name of the person who sent the money. Look for the "From:" section and extract the name. Clean up any extra text like "(ICICI Bank)".
- senderAccountNumber: The sender's bank account number, even if partial (e.g., "...1234").
- recipientName: The full name of the person who received the money. Look for the "To:" section and extract the name (e.g., "To Salman Shaikh").
- recipientAccountNumber: The recipient's bank account number, even if partial.
- recipientUpiId: The recipient's UPI ID. This is often found under the recipient's name and contains an '@' symbol (e.g., "dr.salmanshaik@okaxis").
- status: The transaction status (e.g., Successful, Completed, Paid).
- notes: Any user-added comments, remarks, or descriptions found in the payment details.
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
