

'use server';
/**
 * @fileOverview A Genkit flow for extracting donation details from an image.
 * This is now a three-step flow:
 * 1. Extract raw text from the image.
 * 2. Parse the raw text to get structured data.
 * 3. Enrich the data by identifying if the recipient is an organization member.
 *
 * - extractDonationDetails - A function that handles parsing a donation screenshot.
 */

import { ai } from '@/ai/genkit';
import {
    ExtractDonationDetailsInput,
    ExtractDonationDetailsInputSchema,
    ExtractDonationDetailsOutput,
    ExtractDonationDetailsOutputSchema
} from '@/ai/schemas';
import { extractRawText } from './extract-raw-text-flow';
import { extractDetailsFromText } from './extract-details-from-text-flow';
import { getUserByPhone, getUserByUpiId } from '@/services/user-service';


export async function extractDonationDetails(input: ExtractDonationDetailsInput): Promise<ExtractDonationDetailsOutput> {
  return extractDonationDetailsFlow(input);
}


const extractDonationDetailsFlow = ai.defineFlow(
  {
    name: 'extractDonationDetailsFlow',
    inputSchema: ExtractDonationDetailsInputSchema,
    outputSchema: ExtractDonationDetailsOutputSchema,
  },
  async (input) => {
    // Step 1: Perform OCR to get raw text from the image.
    const rawTextOutput = await extractRawText({ photoDataUri: input.photoDataUri });

    if (!rawTextOutput || !rawTextOutput.rawText) {
        throw new Error("Failed to extract any text from the provided image. It might be unreadable or empty.");
    }
    
    // Step 2: Use the extracted text to get structured details.
    let structuredOutput = await extractDetailsFromText({ rawText: rawTextOutput.rawText });

    if (!structuredOutput) {
      throw new Error("The AI model did not return any structured output from the text.");
    }
    
    // Check for essential fields and provide a specific error if they are missing.
    if (!structuredOutput.amount && !structuredOutput.transactionId && !structuredOutput.utrNumber) {
        let missingFields = [];
        if (!structuredOutput.amount) missingFields.push("Amount");
        if (!structuredOutput.transactionId && !structuredOutput.utrNumber) missingFields.push("Transaction ID or UTR");
        
        // Return a more user-friendly error
        if (missingFields.length > 0) {
            throw new Error(`Scan failed: Could not extract required fields (${missingFields.join(', ')}). Please try a clearer image or enter details manually.`);
        }
    }

    // Step 3: Enrich data by checking if the recipient is an organization member.
    let recipientUser = null;
    if (structuredOutput.recipientUpiId) {
        recipientUser = await getUserByUpiId(structuredOutput.recipientUpiId);
    }
    if (!recipientUser && structuredOutput.recipientPhone) {
        recipientUser = await getUserByPhone(structuredOutput.recipientPhone);
    }

    // If the found user is an admin, classify this as a donation "To Organization Member"
    if (recipientUser && recipientUser.roles.some(r => ['Admin', 'Super Admin', 'Finance Admin'].includes(r))) {
        structuredOutput = {
            ...structuredOutput,
            recipientRole: 'Organization Member',
            recipientId: recipientUser.id,
            recipientName: recipientUser.name, // Overwrite with official name
        };
    }
    
    // Combine the structured data with the raw text for the final output
    return {
        ...structuredOutput,
        rawText: rawTextOutput.rawText,
    };
  }
);
