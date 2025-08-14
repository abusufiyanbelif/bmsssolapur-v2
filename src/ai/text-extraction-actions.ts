

'use server';
/**
 * @fileOverview This file acts as an intermediary for text extraction AI flows.
 * It dynamically imports the Genkit flows to prevent bundling issues in Next.js
 * when these actions are called from client components.
 */

import type { ExtractDonationDetailsOutput } from "@/ai/schemas";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export async function scanProof(proofFile: File): Promise<{success: boolean, details?: ExtractDonationDetailsOutput, error?: string}> {
    let lastError: string = "An unknown error occurred";

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const { extractDonationDetails } = await import('@/ai/flows/extract-donation-details-flow');
            
            const arrayBuffer = await proofFile.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const mimeType = proofFile.type;
            const dataUri = `data:${mimeType};base64,${base64}`;

            const extractedDetails = await extractDonationDetails({ photoDataUri: dataUri });
            
            return { success: true, details: extractedDetails }; // Success, exit the loop

        } catch (e) {
            lastError = e instanceof Error ? e.message : "An unknown error occurred";
            console.error(`Attempt ${attempt} failed:`, lastError);

            // If it's a 503 error, wait and retry. Otherwise, fail immediately.
            if (lastError.includes('503 Service Unavailable') && attempt < MAX_RETRIES) {
                console.log(`Service unavailable, retrying in ${RETRY_DELAY_MS / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt)); // Exponential backoff
            } else {
                // For non-503 errors or if it's the last retry, break the loop and return the error.
                break;
            }
        }
    }
    
    // If all retries fail
    console.error("All retry attempts failed for scanning transfer proof.");
    return { success: false, error: `After ${MAX_RETRIES} attempts, the service is still unavailable. Please try again later. Last error: ${lastError}` };
}
