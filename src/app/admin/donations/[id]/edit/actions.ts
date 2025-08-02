
"use server";

import { updateDonation } from "@/services/donation-service";
import { revalidatePath } from "next/cache";
import type { Donation, DonationPurpose, DonationType, DonationStatus } from "@/services/types";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateDonation(
  donationId: string,
  formData: FormData,
  adminUserId: string,
): Promise<FormState> {
  const rawFormData = Object.fromEntries(formData.entries());

  try {
    const updates: Partial<Donation> = {
        amount: parseFloat(rawFormData.amount as string),
        type: rawFormData.type as DonationType,
        purpose: rawFormData.purpose ? rawFormData.purpose as DonationPurpose : undefined,
        status: rawFormData.status as DonationStatus,
        transactionId: rawFormData.transactionId as string,
        notes: rawFormData.notes as string | undefined,
    };

    await updateDonation(donationId, updates, adminUserId);
    
    revalidatePath("/admin/donations");
    revalidatePath(`/admin/donations/${donationId}/edit`);

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating donation:", error);
    return {
      success: false,
      error: error,
    };
  }
}
