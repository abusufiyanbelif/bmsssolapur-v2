
// src/app/donate/actions.ts
"use server";

import { createDonation } from "@/services/donation-service";
import type { Donation, DonationPurpose } from "@/services/types";
import { Timestamp } from "firebase/firestore";

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
        status: "Pending verification", // Initial status
        notes: `Donation initiated via online payment. User notes: ${formData.notes || 'N/A'}`,
        leadId: formData.leadId || undefined,
        campaignId: formData.campaignId || undefined,
        donationDate: Timestamp.now(), // Tentative date
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
