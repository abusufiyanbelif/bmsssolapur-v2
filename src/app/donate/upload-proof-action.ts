// src/app/donate/upload-proof-action.ts
"use server";

import { createDonation } from "@/services/donation-service";
import type { Donation } from "@/services/types";
import { extractDonationDetails } from "@/ai/flows/extract-donation-details-flow";

interface FormState {
    success: boolean;
    error?: string;
}

// In a real app, you would upload the file to a storage service like Firebase Storage
// and get a URL. This function is a placeholder.
async function handleFileUpload(file: File): Promise<string> {
    console.log(`Received proof file: ${file.name}, size: ${file.size} bytes`);
    // Placeholder for file upload logic
    return `https://placehold.co/600x400.png?text=proof-placeholder`;
}

export async function handleRecordPastDonation(formData: FormData, userId?: string): Promise<FormState> {
    const screenshotFile = formData.get("proof") as File;
    const notes = formData.get("notes") as string;
    
    if (!screenshotFile || screenshotFile.size === 0) {
        return { success: false, error: "A screenshot file is required to upload proof." };
    }

    try {
        const arrayBuffer = await screenshotFile.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUri = `data:${screenshotFile.type};base64,${base64}`;

        const details = await extractDonationDetails({ photoDataUri: dataUri });

        if (!details.amount || !details.transactionId) {
             throw new Error(`Scan failed: Could not extract Amount or Transaction ID. Please try a clearer image.`);
        }

        const paymentScreenshotUrl = await handleFileUpload(screenshotFile);
        
        const newDonationData: Omit<Donation, 'id' | 'createdAt'> = {
            donorId: userId || 'guest',
            donorName: details.donorIdentifier || 'Anonymous Donor',
            amount: details.amount,
            type: 'Sadaqah', // Default type for scanned donations
            purpose: 'To Organization Use', // Default purpose
            status: 'Pending verification',
            isAnonymous: !details.donorIdentifier,
            notes: `Scanned from user upload. Original notes: "${details.notes || 'N/A'}". User notes: "${notes || 'N/A'}"`,
            transactionId: details.transactionId,
            paymentScreenshotUrl: paymentScreenshotUrl,
        };
        
        await createDonation(
            newDonationData,
            'system',
            'System - User Upload',
            'system@example.com'
        );

        return { success: true };
    } catch(e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        console.error("Error recording past donation:", error);
        return { success: false, error: error };
    }
}
