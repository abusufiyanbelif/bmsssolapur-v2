'use server';
/**
 * @fileOverview A Genkit flow for extracting donation details from a payment screenshot.
 *
 * This flow takes a data URI of a payment screenshot, extracts the raw text using
 * an OCR model, and then parses that text to get structured donation details.
 *
 * - extractDonationDetails - The main function that orchestrates the two-step process.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
    ExtractDonationDetailsInput,
    ExtractDonationDetailsInputSchema,
    ExtractDonationDetailsOutput,
    ExtractDonationDetailsOutputSchema,
} from '@/ai/schemas';
import { extractRawTextFlow } from './extract-raw-text-flow';
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
    // Step 1: Extract raw text from the image
    const ocrResult = await extractRawTextFlow({ photoDataUri: input.photoDataUri });

    if (!ocrResult || !ocrResult.rawText) {
      throw new Error("Failed to extract any text from the provided image.");
    }
    
    // Step 2: Extract structured details from the raw text
    const parsedDetails = await extractDetailsFromText({ rawText: ocrResult.rawText });

    return { ...parsedDetails, rawText: ocrResult.rawText };
  }
);
