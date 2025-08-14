// src/app/donate/actions.ts
"use server";

import { createDonation, updateDonation } from "@/services/donation-service";
import type { Donation, DonationPurpose, DonationType } from "@/services/types";
import { Timestamp } from "firebase/firestore";
import { getRawTextFromImage } from "@/ai/text-extraction-actions";
import { scanProof } from "@/ai/text-extraction-actions";
import type { ExtractDonationDetailsOutput } from "@/ai/schemas";


interface FormState {
    success: boolean;
    error?: string;
    upiUrl?: string;
}

interface DonationFormData {
    purpose: DonationPurpose;
    amount: number;
    donorName?: string;
    isAnonymous: boolean;
    userId?: string;
    notes?: string;
    leadId?: string;
    campaignId?: string;
}

// In a real app, you would upload the file to a storage service like Firebase Storage
// and get a URL. This function is a placeholder.
async function handleFileUpload(file: File): Promise<string> {
    console.log(`Received proof file: ${file.name}, size: ${file.size} bytes`);
    // Placeholder for file upload logic
    return `https://placehold.co/600x400.png?text=proof-placeholder`;
}


export async function handleCreatePendingDonation(formData: DonationFormData): Promise<FormState> {
  try {
    const newDonationData: Omit<Donation, 'id' | 'createdAt'> = {
        donorId: formData.userId || 'guest',
        donorName: formData.isAnonymous ? 'Anonymous Donor' : formData.donorName!,
        isAnonymous: formData.isAnonymous,
        amount: formData.amount,
        type: formData.purpose === 'Zakat' ? 'Zakat' : formData.purpose === 'Fitr' ? 'Fitr' : 'Sadaqah', // Simple mapping
        purpose: formData.purpose,
        status: "Pending verification",
        notes: formData.notes,
        leadId: formData.leadId,
        campaignId: formData.campaignId,
    };
    
    // The admin user details are hardcoded here as the donation is user-initiated.
    // In a more complex system, you might have a dedicated system user for this.
    const newDonation = await createDonation(
        newDonationData,
        'system',
        'System',
        'system@example.com'
    );

    const upiUrl = `upi://pay?pa=baitulmal@upi&pn=Baitul Mal Samajik Sanstha Solapur&am=${formData.amount}&tn=Donation for ${formData.purpose}&cu=INR`;
    
    return { success: true, upiUrl };

  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error creating pending donation:", error);
    return {
      success: false,
      error: error,
    };
  }
}

export async function handleScanAndPrefill(formData: FormData): Promise<{success: boolean, details?: ExtractDonationDetailsOutput, error?: string, dataUrl?: string}> {
    try {
        const screenshotFile = formData.get("proof") as File | undefined;
        
        if (!screenshotFile || screenshotFile.size === 0) {
            return { success: false, error: "No file was uploaded." };
        }
        
        const scanResult = await scanProof(screenshotFile);

        if (!scanResult.success || !scanResult.details) {
            throw new Error(scanResult.error || "Failed to extract details from screenshot.");
        }
        
        // Convert File to Base64 Data URL to pass to the next page
        const arrayBuffer = await screenshotFile.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = screenshotFile.type;
        const dataUrl = `data:${mimeType};base64,${base64}`;

        // Return details to pre-fill the form
        return { success: true, details: scanResult.details, dataUrl };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        console.error("Error scanning proof:", error);
        return { success: false, error: error };
    }
}
