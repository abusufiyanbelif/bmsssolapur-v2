
"use server";

import { updateDonation } from "@/services/donation-service";
import { getUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import type { Donation, DonationPurpose, DonationType, DonationStatus } from "@/services/types";
import { Timestamp } from "firebase/firestore";

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
    const adminUser = await getUser(adminUserId);
    if (!adminUser) {
        return { success: false, error: "Admin performing the update could not be found." };
    }
    const donationDateStr = rawFormData.donationDate as string;

    const updates: Partial<Donation> = {
        amount: parseFloat(rawFormData.amount as string),
        type: rawFormData.type as DonationType,
        purpose: rawFormData.purpose ? rawFormData.purpose as DonationPurpose : undefined,
        status: rawFormData.status as DonationStatus,
        transactionId: rawFormData.transactionId as string,
        donationDate: donationDateStr ? Timestamp.fromDate(new Date(donationDateStr)) : Timestamp.now(),
        donorUpiId: rawFormData.donorUpiId as string | undefined,
        paymentApp: rawFormData.paymentApp as string | undefined,
        notes: rawFormData.notes as string | undefined,
    };

    await updateDonation(donationId, updates, { id: adminUser.id!, name: adminUser.name, email: adminUser.email });
    
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
