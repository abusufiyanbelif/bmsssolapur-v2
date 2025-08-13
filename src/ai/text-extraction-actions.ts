

'use server';
/**
 * @fileOverview This file acts as an intermediary for text extraction AI flows.
 * It dynamically imports the Genkit flows to prevent bundling issues in Next.js
 * when these actions are called from client components.
 */

import type { ExtractDonationDetailsOutput } from "@/ai/schemas";

export async function scanProof(proofFile: File): Promise<{success: boolean, details?: ExtractDonationDetailsOutput, error?: string}> {
    try {
        const { extractDonationDetails } = await import('@/ai/flows/extract-donation-details-flow');
        
        const arrayBuffer = await proofFile.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = proofFile.type;
        const dataUri = `data:${mimeType};base64,${base64}`;

        const extractedDetails = await extractDonationDetails({ photoDataUri: dataUri });
        
        return { success: true, details: extractedDetails };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        console.error("Error scanning transfer proof:", error);
        return { success: false, error: error };
    }
}
