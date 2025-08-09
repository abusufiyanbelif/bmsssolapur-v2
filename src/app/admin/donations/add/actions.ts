
"use server";

import { createDonation } from "@/services/donation-service";
import { getUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import type { Donation, DonationPurpose, DonationType } from "@/services/types";
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

    const screenshotFiles = formData.getAll("paymentScreenshots") as File[];
    const screenshotDataUrl = formData.get("paymentScreenshotDataUrl") as string | undefined;

    let paymentScreenshotUrls: string[] = [];
    if (screenshotDataUrl) {
        const file = await dataUrlToFile(screenshotDataUrl, 'manual-screenshot.png');
        const url = await handleFileUpload(file);
        paymentScreenshotUrls.push(url);
    } else if (screenshotFiles && screenshotFiles.length > 0) {
        paymentScreenshotUrls = await Promise.all(
            screenshotFiles.map(file => handleFileUpload(file))
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
        transactionId: formData.get("transactionId") as string,
        donationDate: donationDate,
        donorUpiId: formData.get("donorUpiId") as string | undefined,
        paymentApp: formData.get("paymentApp") as string | undefined,
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
