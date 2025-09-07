
'use server';

import { getAdminDb } from '@/services/firebase-admin';
import { extractRawTextFlow } from '@/ai/flows/extract-raw-text-flow';
/**
 * Performs a lightweight, low-cost read operation against Firestore using the Admin SDK
 * to check if the current environment has the necessary permissions.
 * This function is designed to be called from a server-side context.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function performPermissionCheck(): Promise<{success: boolean, error?: string}> {
    try {
        const adminDb = getAdminDb();
        // Attempt to access a non-existent document. This is a lightweight operation.
        const nonExistentDocRef = adminDb.collection("permission-check").doc("heartbeat");
        await nonExistentDocRef.get();
        return { success: true };
    } catch (e) {
        if (e instanceof Error) {
            // Specifically check for the default credentials error message.
            if (e.message.includes("Could not load the default credentials") || e.message.includes("Could not refresh access token")) {
                 return { success: false, error: 'permission-denied' };
            }
             // Return the specific error message for other cases.
            return { success: false, error: e.message };
        }
        console.error("An unexpected error occurred during permission check:", e);
        return { success: false, error: "An unexpected error occurred during the initial permission check." };
    }
};

interface RawTextScanResult {
    success: boolean;
    rawText?: string;
    error?: string;
}

// This function is now correctly placed in a server context and will be called by client components.
export async function getRawTextFromImage(formData: FormData): Promise<RawTextScanResult> {
    const imageFile = formData.get("imageFile") as File | null;
    
    if (!imageFile) {
        return { success: false, error: "No image file provided." };
    }
    
    let dataUri: string;

    try {
        const arrayBuffer = await imageFile.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        dataUri = `data:${imageFile.type};base64,${base64}`;
    } catch (e) {
         return { success: false, error: "Failed to read the image file." };
    }
    
    try {
        const textResult = await extractRawTextFlow({ photoDataUri: dataUri });

        if (!textResult?.rawText) {
            throw new Error("Failed to extract text from image.");
        }

        return { success: true, rawText: textResult.rawText };

    } catch (e) {
        const lastError = e instanceof Error ? e.message : "An unknown error occurred";
        // Check for the specific API key error message
        if(lastError.includes("API key not valid")) {
            return { success: false, error: "The Gemini API Key is invalid or missing. Please refer to the Troubleshooting Guide to fix this." };
        }
        console.error(`Full scanning process failed:`, lastError);
        return { success: false, error: lastError };
    }
}
