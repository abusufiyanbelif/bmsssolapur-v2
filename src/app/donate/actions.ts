// src/app/donate/actions.ts
"use server";

import { createDonation } from "@/services/donation-service";
import type { Donation, DonationPurpose, ExtractDonationDetailsOutput, User } from "@/services/types";
import { Timestamp } from "firebase/firestore";
import { getUserByUpiId, getUserByBankAccountNumber, getUserByPhone } from "@/services/user-service";
import { getRawTextFromImage as getRawTextFromImageFlow } from '@/ai/flows/extract-raw-text-flow';


interface FormState {
    success: boolean;
    error?: string;
    donation?: Donation;
}

interface DonationFormData {
    purpose: DonationPurpose;
    amount: number;
    donorName?: string;
    isAnonymous: boolean;
    userId?: string;
    phone?: string;
    notes?: string;
    leadId?: string;
    campaignId?: string;
    utrNumber?: string;
    senderBankName?: string;
    senderIfscCode?: string;
}

/**
 * Creates a pending donation record in Firestore.
 * This is called before the user is shown the QR code/UPI details.
 * It allows tracking initiated but potentially uncompleted donations.
 * @param formData - The details of the donation.
 * @returns An object indicating success or failure.
 */
export async function handleCreatePendingDonation(formData: DonationFormData): Promise<FormState> {
  try {
    if (!formData.userId || !formData.donorName) {
        return { success: false, error: "User information is missing. Please log in." };
    }
    
    // Create a pending donation record in our database
    const newDonationData: Omit<Donation, 'id' | 'createdAt'> = {
        donorId: formData.userId,
        donorName: formData.isAnonymous ? 'Anonymous Donor' : formData.donorName,
        isAnonymous: formData.isAnonymous,
        amount: formData.amount,
        type: formData.purpose === 'Zakat' ? 'Zakat' : formData.purpose === 'Fitr' ? 'Fitr' : 'Sadaqah', // Simple mapping
        purpose: formData.purpose,
        status: "Pending verification", // Standardized status
        notes: `Donation initiated via online payment. User notes: ${formData.notes || 'N/A'}`,
        leadId: formData.leadId || undefined,
        campaignId: formData.campaignId || undefined,
        donationDate: Timestamp.now(), // Tentative date
        utrNumber: formData.utrNumber,
        senderBankName: formData.senderBankName,
        senderIfscCode: formData.senderIfscCode,
    };
    
    const newDonation = await createDonation(
        newDonationData,
        formData.userId, // The user themselves are the actor
        formData.donorName,
        undefined
    );

    return { success: true, donation: newDonation };

  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error creating pending donation:", error);
    return {
      success: false,
      error: `Failed to create pending donation: ${error}`,
    };
  }
}

interface ScanResult {
    success: boolean;
    rawText?: string;
    error?: string;
}

export async function getRawTextFromImage(formData: FormData): Promise<ScanResult> {
    const imageFile = formData.get("imageFile") as File | null;
    
    if (!imageFile) {
        return { success: false, error: "No image file provided." };
    }
    
    let dataUri: string;

    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    dataUri = `data:${imageFile.type};base64,${base64}`;
    
    try {
        const textResult = await getRawTextFromImageFlow({ photoDataUri: dataUri });

        if (!textResult?.rawText) {
            throw new Error("Failed to extract text from image.");
        }

        return { success: true, rawText: textResult.rawText };

    } catch (e) {
        const lastError = e instanceof Error ? e.message : "An unknown error occurred";
        console.error(`Full scanning process failed:`, lastError);
        return { success: false, error: lastError };
    }
}
