// src/app/admin/donations/actions.ts
"use server";

import { deleteDonation as deleteDonationService, updateDonation, createDonation, handleUpdateDonationStatus as updateStatusService, getDonation, allocateDonationToLeads } from "@/services/donation-service";
import { getUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import { extractDonationDetails } from "@/ai/flows/extract-donation-details-flow";
import { writeBatch, doc, Timestamp } from "firebase/firestore";
import { db } from "@/services/firebase";
import { DonationStatus } from "@/services/types";
import { logActivity } from "@/services/activity-log-service";

export async function handleDeleteDonation(donationId: string, adminUserId: string) {
    try {
        const adminUser = await getUser(adminUserId);
        if (!adminUser) return { success: false, error: "Admin user not found." };
        await deleteDonationService(donationId, adminUser);
        revalidatePath("/admin/donations");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
    }
}

export async function handleBulkDeleteDonations(donationIds: string[], adminUserId: string) {
    try {
        const adminUser = await getUser(adminUserId);
        if (!adminUser) return { success: false, error: "Admin user not found." };

        const batch = writeBatch(db);
        const logPromises: Promise<void>[] = [];

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
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
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
        return { success: true };
    } catch(e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
    }
}

export async function handleAllocateDonation(
    donationId: string, 
    allocations: { leadId: string; amount: number }[],
    adminUserId: string
) {
    try {
        const [donation, adminUser] = await Promise.all([
            getDonation(donationId),
            getUser(adminUserId)
        ]);

        if (!donation) return { success: false, error: "Donation not found." };
        if (!adminUser) return { success: false, error: "Admin user not found." };
        
        const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
        if (totalAllocated > donation.amount) {
            return { success: false, error: "Total allocation cannot exceed the donation amount." };
        }

        await allocateDonationToLeads(donation, allocations, adminUser);

        revalidatePath("/admin/donations");
        allocations.forEach(alloc => {
            revalidatePath(`/admin/leads/${alloc.leadId}`);
        });
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
        const adminUserId = formData.get("adminUserId") as string | undefined;
        if (!adminUserId) return { success: false, error: "Admin user not found." };
        const adminUser = await getUser(adminUserId);
        if (!adminUser) return { success: false, error: "Admin user not found." };

        const screenshotFile = formData.get("paymentScreenshot") as File | undefined;
        if (!screenshotFile || screenshotFile.size === 0) {
            return { success: false, error: "No file was uploaded." };
        }

        const paymentScreenshotUrl = await handleFileUpload(screenshotFile);

        await updateDonation(donationId, { paymentScreenshotUrls: [paymentScreenshotUrl] }, adminUser, 'Proof Uploaded');
        
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
