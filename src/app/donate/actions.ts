
// src/app/donate/actions.ts
"use server";

import { createDonation, updateDonation } from "@/services/donation-service";
import type { Donation, DonationPurpose, DonationType } from "@/services/types";
import { Timestamp } from "firebase/firestore";
import { startPhonePePayment } from '../campaigns/phonepe-actions';


interface FormState {
    success: boolean;
    error?: string;
    redirectUrl?: string;
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

export async function handleCreatePendingDonation(formData: DonationFormData): Promise<FormState> {
  try {
    if (!formData.userId || !formData.donorName) {
        return { success: false, error: "User information is missing. Please log in." };
    }
    
    // Step 1: Create a pending donation record in our database
    const newDonationData: Omit<Donation, 'id' | 'createdAt'> = {
        donorId: formData.userId,
        donorName: formData.isAnonymous ? 'Anonymous Donor' : formData.donorName,
        isAnonymous: formData.isAnonymous,
        amount: formData.amount,
        type: formData.purpose === 'Zakat' ? 'Zakat' : formData.purpose === 'Fitr' ? 'Fitr' : 'Sadaqah', // Simple mapping
        purpose: formData.purpose,
        status: "Pending verification", // Initial status
        notes: `Donation initiated. Waiting for payment completion. User notes: ${formData.notes || 'N/A'}`,
        leadId: formData.leadId,
        campaignId: formData.campaignId,
        donationDate: Timestamp.now(), // Tentative date
    };
    
    const newDonation = await createDonation(
        newDonationData,
        formData.userId, // The user themselves are the actor
        formData.donorName,
        undefined
    );

    // Step 2: Initiate payment with the gateway
    const paymentRequest = {
        amount: formData.amount,
        userId: formData.userId,
        userName: formData.donorName,
        userPhone: formData.phone,
    };
    const paymentResponse = await startPhonePePayment(paymentRequest);

    if (paymentResponse.success) {
        // Step 3: Update our pending donation record with the gateway's transaction ID
        await updateDonation(newDonation.id!, {
            transactionId: paymentResponse.merchantTransactionId
        });
        return { success: true, redirectUrl: paymentResponse.redirectUrl };
    } else {
        // If gateway fails, update our record to reflect the failure
        await updateDonation(newDonation.id!, {
            status: "Failed/Incomplete",
            notes: `Gateway failed to initiate payment. Error: ${paymentResponse.error}`
        });
        return { success: false, error: paymentResponse.error };
    }

  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error creating pending donation:", error);
    return {
      success: false,
      error: error,
    };
  }
}
