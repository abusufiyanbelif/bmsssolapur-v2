

'use server';
/**
 * @fileOverview A Genkit flow for extracting donation details from an image.
 * This is now a two-step flow:
 * 1. Extract raw text from the image.
 * 2. Parse the raw text to get structured data.
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
    const structuredOutput = await extractDetailsFromText({ rawText: rawTextOutput.rawText });

    if (!structuredOutput) {
      throw new Error("The AI model did not return any structured output from the text.");
    }
    
    // Check for essential fields and provide a specific error if they are missing.
    if (!structuredOutput.amount && !structuredOutput.transactionId && !structuredOutput.utrNumber) {
        let missingFields = [];
        if (!structuredOutput.amount) missingFields.push("Amount");
        if (!structuredOutput.transactionId && !structuredOutput.utrNumber) missingFields.push("Transaction ID or UTR");
        throw new Error(`Scan failed: Could not extract required fields (${missingFields.join(', ')}). Please try a clearer image or enter details manually.`);
    }

    // Combine the structured data with the raw text for the final output
    return {
        ...structuredOutput,
        rawText: rawTextOutput.rawText,
    };
  }
);
