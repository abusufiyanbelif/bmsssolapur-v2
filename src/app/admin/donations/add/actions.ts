
"use server";

import { createDonation } from "@/services/donation-service";
import { getUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import type { Donation, DonationPurpose, DonationType } from "@/services/types";

interface FormState {
    success: boolean;
    error?: string;
    donation?: Donation;
}

// In a real app, you would upload the file to a storage service like Firebase Storage
// and get a URL. For this prototype, we'll just acknowledge the file was received.
async function handleFileUpload(file: File): Promise<string> {
    console.log(`Received file: ${file.name}, size: ${file.size} bytes`);
    // Placeholder for file upload logic
    return `https://placehold.co/600x400.png?text=screenshot-placeholder`;
}

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

    const screenshotFile = formData.get("paymentScreenshot") as File | undefined;
    let paymentScreenshotUrl: string | undefined;
    if (screenshotFile && screenshotFile.size > 0) {
        paymentScreenshotUrl = await handleFileUpload(screenshotFile);
    }
    
    const newDonationData: Omit<Donation, 'id' | 'createdAt'> = {
        donorId: donor.id!,
        donorName: donor.name, // Always store the real name for internal records
        isAnonymous: formData.get("isAnonymous") === 'true', // Flag for public display logic
        amount: parseFloat(formData.get("amount") as string),
        type: formData.get("type") as DonationType,
        purpose: formData.get("purpose") ? formData.get("purpose") as DonationPurpose : undefined,
        status: "Pending verification",
        transactionId: formData.get("transactionId") as string,
        notes: formData.get("notes") as string | undefined,
        paymentScreenshotUrl: paymentScreenshotUrl,
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
