

"use server";

import { createDonation, getDonationByTransactionId } from "@/services/donation-service";
import { getUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import type { Donation, DonationPurpose, DonationType, PaymentMethod, UserRole } from "@/services/types";
import { Timestamp } from "firebase/firestore";

interface FormState {
    success: boolean;
    error?: string;
    donation?: Donation;
}

// In a real app, you would upload the file to a storage service like Firebase Storage
// and get a URL. This function is a placeholder.
async function handleFileUpload(file: File): Promise<string> {
    console.log(`Received file: ${file.name}, size: ${file.size} bytes`);
    // Placeholder for file upload logic
    return `https://placehold.co/600x400.png?text=screenshot-placeholder`;
}

// Helper to convert Base64 Data URL back to a File object
const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
};


export async function handleAddDonation(
  formData: FormData
): Promise<FormState> {
  const adminUserId = formData.get("adminUserId") as string;
  
  if (!adminUserId) {
    return { success: false, error: "Could not identify the administrator performing this action. Please log out and try again." };
  }

  try {
    const adminUser = await getUser(adminUserId); // Fetch admin user details for logging
    if (!adminUser) {
        return { success: false, error: "Admin user not found for logging." };
    }
    
    const donorId = formData.get("donorId") as string;
    if (!donorId) {
        return { success: false, error: "Donor ID is missing." };
    }
    const donor = await getUser(donorId);
    if (!donor) {
        return { success: false, error: "Selected donor user not found." };
    }

    const transactionId = formData.get("transactionId") as string | undefined;
    if (transactionId) {
        const existingDonation = await getDonationByTransactionId(transactionId);
        if (existingDonation) {
            return { success: false, error: `A donation with Transaction ID "${transactionId}" already exists.` };
        }
    }

    const screenshotFile = formData.get("paymentScreenshots") as File | null;
    const screenshotDataUrl = formData.get("paymentScreenshotDataUrl") as string | undefined;

    let paymentScreenshotUrls: string[] = [];
    if (screenshotDataUrl) {
        const file = await dataUrlToFile(screenshotDataUrl, 'manual-screenshot.png');
        const url = await handleFileUpload(file);
        paymentScreenshotUrls.push(url);
    } else if (screenshotFile && screenshotFile.size > 0) {
        paymentScreenshotUrls = await Promise.all(
            [screenshotFile].map(file => handleFileUpload(file))
        );
    }
    
    const donationDateStr = formData.get("donationDate") as string;
    const donationDate = donationDateStr ? Timestamp.fromDate(new Date(donationDateStr)) : Timestamp.now();
    
    const newDonationData: Omit<Donation, 'id' | 'createdAt'> = {
        donorId: donor.id!,
        donorName: donor.name, // Always store the real name for internal records
        isAnonymous: formData.get("isAnonymous") === 'true', // Flag for public display logic
        amount: parseFloat(formData.get("amount") as string),
        type: formData.get("type") as DonationType,
        purpose: formData.get("purpose") ? formData.get("purpose") as DonationPurpose : undefined,
        status: "Pending verification",
        transactionId: transactionId,
        utrNumber: formData.get("utrNumber") as string | undefined,
        googlePayTransactionId: formData.get("googlePayTransactionId") as string | undefined,
        phonePeTransactionId: formData.get("phonePeTransactionId") as string | undefined,
        paytmUpiReferenceNo: formData.get("paytmUpiReferenceNo") as string | undefined,
        donationDate: donationDate,
        paymentApp: formData.get("paymentApp") as string | undefined,
        donorUpiId: formData.get("donorUpiId") as string | undefined,
        donorPhone: formData.get("donorPhone") as string | undefined,
        donorBankAccount: formData.get("donorBankAccount") as string | undefined,
        phonePeSenderName: formData.get("phonePeSenderName") as string | undefined,
        phonePeRecipientName: formData.get("phonePeRecipientName") as string | undefined,
        googlePaySenderName: formData.get("googlePaySenderName") as string | undefined,
        googlePayRecipientName: formData.get("googlePayRecipientName") as string | undefined,
        paytmSenderName: formData.get("paytmSenderName") as string | undefined,
        paytmRecipientName: formData.get("paytmRecipientName") as string | undefined,
        recipientId: formData.get("recipientId") as string | undefined,
        recipientRole: formData.get("recipientRole") as 'Beneficiary' | 'Referral' | undefined,
        recipientPhone: formData.get("recipientPhone") as string | undefined,
        recipientUpiId: formData.get("recipientUpiId") as string | undefined,
        recipientAccountNumber: formData.get("recipientAccountNumber") as string | undefined,
        paymentMethod: formData.get("paymentMethod") as PaymentMethod | undefined,
        notes: formData.get("notes") as string | undefined,
        paymentScreenshotUrls: paymentScreenshotUrls,
    };

    const newDonation = await createDonation(
        newDonationData,
        adminUser.id!,
        adminUser.name,
        adminUser.email
    );
    
    const tipAmount = parseFloat(formData.get("tipAmount") as string);
    if (!isNaN(tipAmount) && tipAmount > 0) {
        const tipDonationData: Omit<Donation, 'id' | 'createdAt'> = {
            ...newDonationData,
            amount: tipAmount,
            type: 'Sadaqah', // Tips can be categorized as Sadaqah
            purpose: 'To Organization Use', // This is key for tracking
            notes: `Tip from donation transaction ID: ${newDonationData.transactionId}`,
            isAnonymous: true, // Tips for the org should likely always be anonymous publicly
        };
         await createDonation(
            tipDonationData,
            adminUser.id!,
            adminUser.name,
            adminUser.email
        );
    }

    revalidatePath("/admin/donations");

    return {
      success: true,
      donation: newDonation,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error adding donation:", error);
    return {
      success: false,
      error: error,
    };
  }
}

interface AvailabilityResult {
    isAvailable: boolean;
    existingDonationId?: string;
}

export async function checkTransactionId(transactionId: string): Promise<AvailabilityResult> {
    if (!transactionId) return { isAvailable: true };
    const existingDonation = await getDonationByTransactionId(transactionId);
    if (existingDonation) {
        return { isAvailable: false, existingDonationId: existingDonation.id };
    }
    return { isAvailable: true };
}
