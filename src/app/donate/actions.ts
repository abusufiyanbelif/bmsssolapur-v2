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
