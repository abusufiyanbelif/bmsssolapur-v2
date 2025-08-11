// src/app/admin/donations/actions.ts
"use server";

import { deleteDonation, updateDonation, createDonation, handleUpdateDonationStatus as updateStatusService, getDonation } from "@/services/donation-service";
import { getUser } from "@/services/user-service";
import { allocateDonationToLead } from "@/services/lead-service";
import { revalidatePath } from "next/cache";
import { extractDonationDetails } from "@/ai/flows/extract-donation-details-flow";
import { writeBatch, doc, Timestamp } from "firebase/firestore";
import { db } from "@/services/firebase";
import { DonationStatus } from "@/services/types";
import { logActivity } from "@/services/activity-log-service";

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

export async function handleBulkDeleteDonations(donationIds: string[]) {
    try {
        const batch = writeBatch(db);
        donationIds.forEach(id => {
            const docRef = doc(db, "donations", id);
            batch.delete(docRef);
        });
        await batch.commit();
        revalidatePath("/admin/donations");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
    }
}

export async function handleUpdateDonationStatus(donationId: string, status: DonationStatus) {
    try {
        // In a real app, you would get the admin user from the session.
        // For now, we'll assume a default admin for logging purposes.
        const adminUser = await getUser('admin.user');
        if (!adminUser) {
            return { success: false, error: "Could not find default admin user for logging." };
        }
        await updateStatusService(donationId, status, adminUser);
        revalidatePath("/admin/donations");
        return { success: true };
    } catch(e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
    }
}

export async function handleAllocateDonation(donationId: string, linkTo: 'lead' | 'campaign', linkId: string, adminUserId: string) {
    try {
        const [donation, adminUser] = await Promise.all([
            getDonation(donationId),
            getUser(adminUserId)
        ]);

        if (!donation) return { success: false, error: "Donation not found." };
        if (!adminUser) return { success: false, error: "Admin user not found." };
        
        if (linkTo === 'lead') {
            // Add the allocation to the lead
            await allocateDonationToLead(linkId, {
                donationId: donationId,
                amount: donation.amount,
                allocatedAt: Timestamp.now(),
                allocatedByUserId: adminUser.id!,
                allocatedByUserName: adminUser.name,
            });

            // Update the donation's status and link
            await updateDonation(donationId, { leadId: linkId, status: 'Allocated' }, adminUser);

             await logActivity({
                userId: adminUser.id!,
                userName: adminUser.name,
                userEmail: adminUser.email,
                role: "Admin",
                activity: `Donation Allocated`,
                details: { donationId: donationId, amount: donation.amount, linkedLeadId: linkId }
            });

        } else if (linkTo === 'campaign') {
            await updateDonation(donationId, { campaignId: linkId, status: 'Allocated' }, adminUser);
        }

        revalidatePath("/admin/donations");
        revalidatePath(`/admin/leads/${linkId}`);
        return { success: true };
    } catch(e) {
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

        await updateDonation(donationId, { paymentScreenshotUrls: [paymentScreenshotUrl] });
        
        revalidatePath("/admin/donations");
        
        return { success: true, url: paymentScreenshotUrl };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
    }
}


export async function handleScanDonationProof(formData: FormData) {
    try {
        const screenshotFile = formData.get("paymentScreenshot") as File | undefined;
        
        if (!screenshotFile || screenshotFile.size === 0) {
            return { success: false, error: "No file was uploaded." };
        }
        
        const arrayBuffer = await screenshotFile.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = screenshotFile.type;
        const dataUri = `data:${mimeType};base64,${base64}`;

        const extractedDetails = await extractDonationDetails({ photoDataUri: dataUri });
        
        return { success: true, details: extractedDetails };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        console.error("Error scanning donation proof:", error);
        return { success: false, error };
    }
}
