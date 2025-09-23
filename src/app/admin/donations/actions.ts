
// src/app/admin/donations/actions.ts
"use server";

import { deleteDonation as deleteDonationService, updateDonation, createDonation, handleUpdateDonationStatus as updateStatusService, getDonation, allocateDonationToLeads } from "@/services/donation-service";
import { getUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import { writeBatch, doc, Timestamp, arrayUnion } from "firebase/firestore";
import { db } from "@/services/firebase";
import { DonationStatus } from "@/services/types";
import { logActivity } from "@/services/activity-log-service";
import { uploadFile } from "@/services/storage-service";

export async function handleDeleteDonation(donationId: string, adminUserId: string) {
    try {
        const adminUser = await getUser(adminUserId);
        if (!adminUser) return { success: false, error: "Admin user not found for logging." };
        
        const donationToDelete = await getDonation(donationId);
        if (donationToDelete?.status === 'Allocated' || donationToDelete?.status === 'Partially Allocated') {
            return { success: false, error: "This donation cannot be deleted because it has already been allocated to one or more leads. Please review the lead's fund transfers first." };
        }

        await deleteDonationService(donationId, adminUser);
        revalidatePath("/admin/donations");
        revalidatePath("/admin");
        revalidatePath("/");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred while deleting the donation.";
        console.error("Error deleting donation:", error);
        return { success: false, error: `Failed to delete donation: ${error}` };
    }
}

export async function handleBulkDeleteDonations(donationIds: string[], adminUserId: string) {
    try {
        const adminUser = await getUser(adminUserId);
        if (!adminUser) return { success: false, error: "Admin user not found for logging." };

        const batch = writeBatch(db);
        const logPromises: Promise<void>[] = [];
        
        for (const id of donationIds) {
            const donation = await getDonation(id);
             if (donation?.status === 'Allocated' || donation?.status === 'Partially Allocated') {
                throw new Error(`Donation "${donation.id}" from ${donation.donorName} cannot be deleted because it has been allocated. Please de-allocate funds first.`);
            }
        }

        for (const id of donationIds) {
            const donationDocRef = doc(db, "donations", id);
            batch.delete(donationDocRef);
            
            // As we don't know the donation details after deletion, we log with the ID
            logPromises.push(logActivity({
                userId: adminUser.id!,
                userName: adminUser.name,
                userEmail: adminUser.email,
                role: 'Admin',
                activity: 'Donation Deleted',
                details: { donationId: id, details: `Part of bulk delete operation.` },
            }));
        }
        
        await Promise.all([batch.commit(), ...logPromises]);
        
        revalidatePath("/admin/donations");
        revalidatePath("/admin");
        revalidatePath("/");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred during bulk deletion.";
        console.error("Error bulk deleting donations:", error);
        return { success: false, error: `Failed to delete donations: ${error}` };
    }
}

export async function handleUpdateDonationStatus(donationId: string, status: DonationStatus, adminUserId: string) {
    try {
        const adminUser = await getUser(adminUserId);
        if (!adminUser) {
            return { success: false, error: "Could not find administrator user for logging." };
        }
        await updateStatusService(donationId, status, adminUser);
        revalidatePath("/admin/donations");
        revalidatePath(`/admin/donations/${donationId}/edit`);
        revalidatePath("/admin");
        revalidatePath("/");
        return { success: true };
    } catch(e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred while updating status.";
        console.error("Error updating donation status:", error);
        return { success: false, error: `Failed to update status: ${error}` };
    }
}

export async function handleAllocateDonation(
    donationId: string, 
    allocations: { leadId: string; amount: number }[],
    adminUserId: string,
    campaignId?: string
) {
    try {
        const [donation, adminUser] = await Promise.all([
            getDonation(donationId),
            getUser(adminUserId)
        ]);

        if (!donation) return { success: false, error: "Donation not found." };
        if (!adminUser) return { success: false, error: "Admin user not found for logging." };
        
        if (campaignId) {
             // Simple campaign allocation
            await updateDonation(donationId, { 
                campaignId: campaignId,
                status: 'Allocated'
            }, adminUser, 'Donation Allocated');
        } else {
            // Complex lead allocation
            const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
            if (totalAllocated > donation.amount) {
                return { success: false, error: "Total allocation cannot exceed the donation amount." };
            }

            await allocateDonationToLeads(donation, allocations, adminUser);
             allocations.forEach(alloc => {
                revalidatePath(`/admin/leads/${alloc.leadId}`);
            });
        }
       
        revalidatePath("/admin/donations");
        revalidatePath("/admin");
        revalidatePath("/");
        if(campaignId) revalidatePath(`/admin/campaigns/${campaignId}/edit`);
        
        return { success: true };
    } catch(e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred during allocation.";
        console.error("Error allocating donation:", error);
        return { success: false, error: `Failed to allocate donation: ${error}` };
    }
}

export async function handleUploadDonationProof(
    donationId: string, 
    formData: FormData,
    // This is a placeholder for a real implementation of progress reporting
    // In a real app, you'd use a library that supports streaming uploads and callbacks.
    onProgress?: (progress: number) => void
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const adminUserId = formData.get("adminUserId") as string | undefined;
        if (!adminUserId) return { success: false, error: "Admin user ID is missing." };
        const adminUser = await getUser(adminUserId);
        if (!adminUser) return { success: false, error: "Admin user not found for logging." };

        const screenshotFile = formData.get("paymentScreenshot") as File | undefined;
        if (!screenshotFile || screenshotFile.size === 0) {
            return { success: false, error: "No file was uploaded." };
        }
        
        const donation = await getDonation(donationId);
        if(!donation) return { success: false, error: "Donation record not found." };
        
        const donor = await getUser(donation.donorId);
        if (!donor || !donor.userKey) {
            return { success: false, error: "Could not find donor's user key." };
        }

        const uploadPath = `donations/${donor.userKey}/${donationId}/proofs/`;

        // The actual upload needs to be done on the client to report progress to the UI
        // This server action is now more of a finalization step.
        // For this implementation, we will simulate the logic and assume the URL is passed in.
        // In a real scenario, you'd have a client component handle the upload with `uploadFile`
        // and then call a server action with the resulting URL.
        // Let's adapt this to perform the upload server-side but acknowledge progress isn't sent to client from here.
        const paymentScreenshotUrl = await uploadFile(screenshotFile, uploadPath, onProgress);

        // Add the new URL to the existing array without overwriting
        await updateDonation(donationId, { paymentScreenshotUrls: arrayUnion(paymentScreenshotUrl) as any }, adminUser, 'Proof Uploaded');
        
        revalidatePath("/admin/donations");
        revalidatePath(`/admin/donations/${donationId}/edit`);
        
        return { success: true, url: paymentScreenshotUrl };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred during file upload.";
        console.error("Error uploading donation proof:", error);
        return { success: false, error: `Failed to upload proof: ${error}` };
    }
}
