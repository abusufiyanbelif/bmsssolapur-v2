

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


const promptText = `You are an expert financial assistant. Analyze the provided image of a payment screenshot from a UPI app (like GPay, PhonePe, Paytm, etc.).
    Your task is to carefully extract the following details and return them in a structured JSON format:
    
    - amount: The primary transaction amount. It must be a number.
    - transactionId: The Transaction ID, UTR, or any other reference number. It must be a string. If multiple IDs are present (like a Transaction ID and a UTR), prefer the UTR number.
    - date: The date of the transaction. Format it as YYYY-MM-DD.
    - paymentApp: The method or app of payment (e.g., UPI, Bank Transfer, GPay, PhonePe, Paytm). Infer this from the UI if possible.
    - donorName: The full name of the person who sent the money (e.g., 'Bhagnagri Zainul'). Look for fields like "Received from" or "Paid by". Do NOT include phone numbers or UPI IDs in this field.
    - donorPhone: The donor's 10-digit phone number if it is explicitly visible. This should only contain digits.
    - donorUpiId: The donor's UPI ID if it is explicitly visible (it will contain an '@' symbol, e.g., 'username@okhdfc').
    - bankAccountNumber: The donor's bank account number. Often this is partially masked (e.g., "From account XXXXXX1234"). Extract the visible part.
    - notes: Any user-added comments, remarks, or descriptions found in the payment details. This is often labeled as "Add a note", "Message", or "Remarks".

    If a field is not clearly visible in the screenshot, omit it from the output rather than guessing. Pay close attention to distinguishing between the name, phone number, and UPI ID.`;


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
      throw new Error("The AI model did not return any output. The image might be unreadable.");
    }
    
    // Check for essential fields and provide a specific error if they are missing.
    if (!output.amount || !output.transactionId) {
        let missingFields = [];
        if (!output.amount) missingFields.push("Amount");
        if (!output.transactionId) missingFields.push("Transaction ID");
        throw new Error(`Scan failed: Could not extract required fields (${missingFields.join(', ')}). Please try a clearer image or enter details manually.`);
    }

    return output;
  }
);
