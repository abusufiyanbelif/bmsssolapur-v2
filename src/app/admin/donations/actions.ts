
"use server";

import { deleteDonation, updateDonation } from "@/services/donation-service";
import { revalidatePath } from "next/cache";

export async function handleDeleteDonation(donationId: string) {
    try {
        await deleteDonation(donationId);
        revalidatePath("/admin/donations");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
    }
}

// In a real app, you would upload the file to a storage service like Firebase Storage
// and get a URL. For this prototype, we'll just acknowledge the file was received.
async function handleFileUpload(file: File): Promise<string> {
    console.log(`Received file: ${file.name}, size: ${file.size} bytes`);
    // Placeholder for file upload logic
    return `https://placehold.co/600x400.png?text=screenshot-placeholder`;
}


export async function handleUploadDonationProof(donationId: string, formData: FormData) {
    try {
        const screenshotFile = formData.get("paymentScreenshot") as File | undefined;
        if (!screenshotFile || screenshotFile.size === 0) {
            return { success: false, error: "No file was uploaded." };
        }

        const paymentScreenshotUrl = await handleFileUpload(screenshotFile);

        await updateDonation(donationId, { paymentScreenshotUrl });
        
        revalidatePath("/admin/donations");
        
        return { success: true, url: paymentScreenshotUrl };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
    }
}
