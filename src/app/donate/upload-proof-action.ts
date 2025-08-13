

// src/app/donate/upload-proof-action.ts
"use server";

import { createDonation } from "@/services/donation-service";
import { getUser } from "@/services/user-service";
import type { Donation } from "@/services/types";
import { scanProof } from "@/ai/text-extraction-actions";
import { isConfigValid } from "@/services/firebase";

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

// Function to normalize names for comparison (e.g., "John F. Doe" vs "John Doe")
const normalizeString = (str: string) => {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function handleRecordPastDonation(formData: FormData, userId?: string): Promise<FormState> {
    if (!isConfigValid || !userId) {
        return { success: false, error: "System or user not properly configured." };
    }

    const screenshotFile = formData.get("proof") as File;
    const notes = formData.get("notes") as string;
    
    if (!screenshotFile || screenshotFile.size === 0) {
        return { success: false, error: "A screenshot file is required to upload proof." };
    }

    try {
        const loggedInUser = await getUser(userId);
        if (!loggedInUser) {
            return { success: false, error: "Could not find the logged-in user's profile." };
        }

        const scanResult = await scanProof(screenshotFile);

        if (!scanResult.success || !scanResult.details) {
            throw new Error(scanResult.error || "Failed to extract details from screenshot.");
        }
        
        const details = scanResult.details;

        // --- VALIDATION STEP ---
        if (details.senderName) {
            const extractedName = details.senderName;
            const loggedInUserName = loggedInUser.name;
            
            // A simple check if one name string contains the other, ignoring case and spaces.
            const isNameMatch = normalizeString(loggedInUserName).includes(normalizeString(extractedName)) || 
                                normalizeString(extractedName).includes(normalizeString(loggedInUserName));

            if (!isNameMatch) {
                return { 
                    success: false, 
                    error: `The name on the screenshot ("${extractedName}") does not appear to match your account name ("${loggedInUserName}"). Please upload the correct screenshot or contact support.`
                };
            }
        }
        
        if (!details.amount || !details.transactionId) {
             throw new Error(`Scan failed: Could not extract Amount or Transaction ID. Please try a clearer image.`);
        }

        const paymentScreenshotUrl = await handleFileUpload(screenshotFile);
        
        const newDonationData: Omit<Donation, 'id' | 'createdAt'> = {
            donorId: userId,
            donorName: loggedInUser.name, // Always use the logged-in user's name
            amount: details.amount,
            type: 'Sadaqah', // Default type for scanned donations
            purpose: 'To Organization Use', // Default purpose
            status: 'Pending verification',
            isAnonymous: loggedInUser.isAnonymousAsDonor, // Respect user's profile setting
            notes: `Scanned from user upload. Extracted notes: "${details.notes || 'N/A'}". User notes: "${notes || 'N/A'}"`,
            transactionId: details.transactionId,
            paymentScreenshotUrls: [paymentScreenshotUrl],
            donationDate: details.date ? new Date(details.date) : new Date(),
            paymentApp: details.paymentApp,
            donorUpiId: details.donorUpiId,
        };
        
        await createDonation(
            newDonationData,
            userId, // The user performing the action is themselves
            loggedInUser.name,
            loggedInUser.email
        );

        return { success: true };
    } catch(e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        console.error("Error recording past donation:", error);
        return { success: false, error: error };
    }
}
