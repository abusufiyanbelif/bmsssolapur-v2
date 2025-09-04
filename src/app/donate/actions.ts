// src/app/donate/actions.ts
"use server";

import { createDonation } from "@/services/donation-service";
import type { Donation, DonationPurpose, ExtractDonationDetailsOutput, User } from "@/services/types";
import { Timestamp } from "firebase/firestore";
import { getRawTextFromImage } from "@/ai/flows/extract-raw-text-flow";
import { extractDetailsFromText as extractDetailsFromTextFlow } from "@/ai/flows/extract-details-from-text-flow";
import { getUserByUpiId, getUserByBankAccountNumber, getUserByPhone } from "@/services/user-service";

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
        status: "Pending", // Standardized status
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

// --- AI SCANNING ACTIONS ---

interface ScanResult {
    success: boolean;
    details?: ExtractDonationDetailsOutput;
    error?: string;
    donorFound?: boolean;
}

export async function getDetailsFromText(rawText: string): Promise<ScanResult> {
    if (!rawText) {
        return { success: false, error: "No text was provided for parsing." };
    }

    try {
        const extractedDetails = await extractDetailsFromTextFlow({ rawText });
        
        let foundDonor: User | null = null;
        if (extractedDetails.senderUpiId) foundDonor = await getUserByUpiId(extractedDetails.senderUpiId);
        if (!foundDonor && extractedDetails.donorPhone) {
            const phone = extractedDetails.donorPhone.replace(/\D/g,'').slice(-10);
            foundDonor = await getUserByPhone(phone);
        }
        if (!foundDonor && extractedDetails.senderAccountNumber) foundDonor = await getUserByBankAccountNumber(extractedDetails.senderAccountNumber);

        return { 
            success: true, 
            details: { ...extractedDetails, donorId: foundDonor?.id, rawText: rawText },
            donorFound: !!foundDonor,
        };
    } catch (e) {
        const lastError = e instanceof Error ? e.message : "An unknown error occurred";
        console.error(`Text parsing failed:`, lastError);
        return { success: false, error: `Text parsing failed: ${lastError}` };
    }
}