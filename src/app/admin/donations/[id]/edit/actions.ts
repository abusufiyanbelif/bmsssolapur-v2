

"use server";

import {
  getDonation,
  updateDonation as updateDonationService,
} from "@/services/donation-service";
import {
  Donation,
  DonationPurpose,
  DonationStatus,
  DonationType,
  PaymentMethod,
  User,
} from "@/services/types";
import { revalidatePath } from "next/cache";
import { Timestamp } from "firebase/firestore";
import { getUser } from "@/services/user-service";
import { logActivity } from "@/services/activity-log-service";

interface FormState {
  success: boolean;
  error?: string;
}

// Helper function to find differences between two objects for logging
const getChangedFields = (original: Donation, updates: Partial<Donation>) => {
  const changes: Record<string, { from: any; to: any }> = {};
  for (const key in updates) {
    const typedKey = key as keyof Donation;
    const originalValue = original[typedKey];
    const updatedValue = updates[typedKey];

    // Simple comparison for most fields
    if (String(originalValue) !== String(updatedValue)) {
      if (originalValue instanceof Date && updatedValue instanceof Date) {
        if (originalValue?.getTime() !== updatedValue?.getTime()) {
          changes[typedKey] = {
            from: originalValue?.toISOString().split("T")[0],
            to: updatedValue?.toISOString().split("T")[0],
          };
        }
      } else {
        changes[typedKey] = {
          from: originalValue || "N/A",
          to: updatedValue,
        };
      }
    }
  }
  return changes;
};

export async function handleUpdateDonation(
  donationId: string,
  formData: FormData,
  adminUserId: string
): Promise<FormState> {
  if (!adminUserId) {
    return {
      success: false,
      error:
        "Could not identify the administrator performing this action. Please log out and try again.",
    };
  }

  try {
    const adminUser = await getUser(adminUserId);
    if (!adminUser) {
      return { success: false, error: "Admin user not found for logging." };
    }

    const originalDonation = await getDonation(donationId);
    if (!originalDonation) {
      return { success: false, error: "Original donation record not found." };
    }

    const donationDateStr = formData.get("donationDate") as string;
    const donationDate = donationDateStr
      ? Timestamp.fromDate(new Date(donationDateStr))
      : originalDonation.donationDate;

    const updates: Partial<Donation> = {
      isAnonymous: formData.get("isAnonymous") === "on",
      amount: parseFloat(formData.get("amount") as string),
      type: formData.get("type") as DonationType,
      purpose: formData.get("purpose")
        ? (formData.get("purpose") as DonationPurpose)
        : undefined,
      category: formData.get("category") as string | undefined,
      status: formData.get("status") as DonationStatus,
      transactionId: formData.get("transactionId") as string | undefined,
      utrNumber: formData.get("utrNumber") as string | undefined,
      googlePayTransactionId:
        formData.get("googlePayTransactionId") as string | undefined,
      phonePeTransactionId:
        formData.get("phonePeTransactionId") as string | undefined,
      paytmUpiReferenceNo:
        formData.get("paytmUpiReferenceNo") as string | undefined,
      donationDate: donationDate,
      paymentApp: formData.get("paymentApp") as string | undefined,
      donorUpiId: formData.get("donorUpiId") as string | undefined,
      donorPhone: formData.get("donorPhone") as string | undefined,
      donorBankAccount: formData.get("donorBankAccount") as string | undefined,
      senderName: formData.get("senderName") as string | undefined,
      phonePeSenderName: formData.get("phonePeSenderName") as string | undefined,
      googlePaySenderName: formData.get("googlePaySenderName") as string | undefined,
      paytmSenderName: formData.get("paytmSenderName") as string | undefined,
      recipientName: formData.get("recipientName") as string | undefined,
      phonePeRecipientName: formData.get("phonePeRecipientName") as string | undefined,
      googlePayRecipientName: formData.get("googlePayRecipientName") as string | undefined,
      paytmRecipientName: formData.get("paytmRecipientName") as string | undefined,
      recipientId: formData.get("recipientId") as string | undefined,
      recipientRole: formData.get("recipientRole") as
        | "Beneficiary"
        | "Referral"
        | "Organization Member"
        | undefined,
      recipientPhone: formData.get("recipientPhone") as string | undefined,
      recipientUpiId: formData.get("recipientUpiId") as string | undefined,
      recipientAccountNumber:
        formData.get("recipientAccountNumber") as string | undefined,
      paymentMethod: formData.get("paymentMethod") as PaymentMethod | undefined,
      notes: formData.get("notes") as string | undefined,
      leadId: formData.get("leadId") as string | undefined,
      campaignId: formData.get("campaignId") as string | undefined,
    };

    const changes = getChangedFields(originalDonation, updates);

    // Only update and log if there are actual changes
    if (Object.keys(changes).length > 0) {
      await updateDonationService(donationId, updates, adminUser);
    }
    
    revalidatePath("/admin/donations");
    revalidatePath(`/admin/donations/${donationId}/edit`);

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating donation:", error);
    return {
      success: false,
      error: `Failed to update donation: ${error}`,
    };
  }
}
