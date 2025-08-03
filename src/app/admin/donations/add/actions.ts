
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

    const screenshotFile = formData.get("paymentScreenshot") as File | undefined;
    let paymentScreenshotUrl: string | undefined;
    if (screenshotFile && screenshotFile.size > 0) {
        paymentScreenshotUrl = await handleFileUpload(screenshotFile);
    }
    
    const newDonationData: Omit<Donation, 'id' | 'createdAt'> = {
        donorId: formData.get("donorId") as string,
        donorName: formData.get("donorName") as string,
        isAnonymous: formData.get("isAnonymous") === 'true',
        amount: parseFloat(formData.get("amount") as string),
        type: formData.get("type") as DonationType,
        purpose: formData.get("purpose") ? formData.get("purpose") as DonationPurpose : undefined,
        status: "Pending verification",
        transactionId: formData.get("transactionId") as string,
        paymentScreenshotUrl: paymentScreenshotUrl,
    };

    const newDonation = await createDonation(
        newDonationData,
        adminUser.id!,
        adminUser.name,
        adminUser.email
    );
    
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
