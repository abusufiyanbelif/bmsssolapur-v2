
"use server";

import { createDonation } from "@/services/donation-service";
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
  const rawFormData = Object.fromEntries(formData.entries());
  // In a real app, you'd get the logged-in user's ID here.
  const adminUserId = "admin_user_placeholder_id";

  try {
    const screenshotFile = rawFormData.paymentScreenshot as File | undefined;
    let paymentScreenshotUrl: string | undefined;
    if (screenshotFile && screenshotFile.size > 0) {
        paymentScreenshotUrl = await handleFileUpload(screenshotFile);
    }
    
    const newDonationData: Omit<Donation, 'id' | 'createdAt'> = {
        donorId: rawFormData.donorId as string,
        donorName: rawFormData.donorName as string,
        isAnonymous: rawFormData.isAnonymous === 'true',
        amount: parseFloat(rawFormData.amount as string),
        type: rawFormData.type as DonationType,
        purpose: rawFormData.purpose ? rawFormData.purpose as DonationPurpose : undefined,
        status: "Pending verification",
        transactionId: rawFormData.transactionId as string,
        paymentScreenshotUrl: paymentScreenshotUrl,
    };

    const newDonation = await createDonation(newDonationData, adminUserId);
    
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
