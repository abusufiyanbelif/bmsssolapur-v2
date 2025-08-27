

"use server";

import { deleteLead as deleteLeadService, getLead, updateLead } from "@/services/lead-service";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/services/activity-log-service";
import { getUser, getUserByUserId } from "@/services/user-service";
import { FundTransfer, LeadStatus, LeadVerificationStatus, User, Donation, Allocation } from "@/services/types";
import { arrayUnion, increment, writeBatch, doc, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "@/services/firebase";
import { getDonation, updateDonation } from "@/services/donation-service";
import { uploadFile } from "@/services/storage-service";
import { format } from "date-fns";

export async function handleDeleteLead(leadId: string, adminUserId: string) {
    try {
        const adminUser = await getUser(adminUserId);
        if (!adminUser) return { success: false, error: "Admin user not found for logging." };
        await deleteLeadService(leadId, adminUser);
        revalidatePath("/admin/leads");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred while deleting the lead.";
        console.error("Error deleting lead:", error);
        return { success: false, error: `Failed to delete lead: ${error}` };
    }
}

export async function handleBulkDeleteLeads(leadIds: string[], adminUserId: string) {
    try {
        const adminUser = await getUser(adminUserId);
        if (!adminUser) return { success: false, error: "Admin user not found for logging." };
        const batch = writeBatch(db);
        const logPromises: Promise<void>[] = [];

        for (const id of leadIds) {
            const leadDocRef = doc(db, "leads", id);
            batch.delete(leadDocRef);
             logPromises.push(logActivity({
                userId: adminUser.id!,
                userName: adminUser.name,
                userEmail: adminUser.email,
                role: 'Admin',
                activity: 'Lead Deleted',
                details: { leadId: id, details: `Part of bulk delete operation.` },
            }));
        }
        await Promise.all([batch.commit(), ...logPromises]);
        revalidatePath("/admin/leads");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred during bulk deletion.";
        console.error("Error bulk deleting leads:", error);
        return { success: false, error: `Failed to delete leads: ${error}` };
    }
}


export async function handleBulkUpdateLeadStatus(
    leadIds: string[], 
    statusType: 'caseStatus' | 'verificationStatus',
    newStatus: LeadStatus | LeadVerificationStatus,
    adminUserId: string
) {
     try {
        const adminUser = await getUser(adminUserId);
        if (!adminUser) return { success: false, error: "Admin user not found for logging." };

        const batch = writeBatch(db);
        const logPromises: Promise<void>[] = [];

        for (const id of leadIds) {
            const leadDocRef = doc(db, "leads", id);
            const updatePayload = statusType === 'caseStatus' 
                ? { status: newStatus } 
                : { verifiedStatus: newStatus };
            batch.update(leadDocRef, updatePayload);
            
            logPromises.push(logActivity({
                userId: adminUser.id!,
                userName: adminUser.name,
                userEmail: adminUser.email,
                role: 'Admin',
                activity: `Bulk Status Change`,
                details: { leadId: id, newStatus: newStatus, type: statusType, details: `Part of bulk update operation.` },
            }));
        }
        
        await Promise.all([batch.commit(), ...logPromises]);
        
        revalidatePath("/admin/leads");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred during bulk status update.";
        console.error("Error bulk updating lead status:", error);
        return { success: false, error: `Failed to update lead statuses: ${error}` };
    }
}


export async function handleUploadVerificationDocument(leadId: string, formData: FormData) {
    try {
        const documentFile = formData.get("document") as File | undefined;
        const adminUserId = formData.get("adminUserId") as string | undefined;

        if (!documentFile || documentFile.size === 0) {
            return { success: false, error: "No file was uploaded." };
        }
        if (!adminUserId) {
            return { success: false, error: "Could not identify the administrator." };
        }

        const [adminUser, lead] = await Promise.all([
            getUser(adminUserId),
            getLead(leadId)
        ]);

        if (!adminUser || !lead) {
            return { success: false, error: "Admin user or lead not found." };
        }

        const uploadPath = `leads/${leadId}/documents/`;
        const verificationDocumentUrl = await uploadFile(documentFile, uploadPath);

        await updateLead(leadId, { verificationDocumentUrl });

        await logActivity({
            userId: adminUser.id!,
            userName: adminUser.name,
            userEmail: adminUser.email,
            role: "Admin", // Generic admin role for this action
            activity: "Document Uploaded",
            details: {
                leadId: lead.id!,
                leadName: lead.name,
                fileName: documentFile.name,
                leadStatus: lead.verifiedStatus,
            },
        });
        
        revalidatePath(`/admin/leads/${leadId}`);
        
        return { success: true, url: verificationDocumentUrl };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred while uploading document.";
        console.error("Error uploading verification document:", error);
        return { success: false, error: `Failed to upload document: ${error}` };
    }
}

export async function handleFundTransfer(leadId: string, formData: FormData) {
     try {
        const adminUserId = formData.get("adminUserId") as string;
        const amountStr = formData.get("amount") as string;
        const amount = amountStr ? parseFloat(amountStr) : 0;
        
        const proofFile = formData.get("proof") as File | undefined;
        const scannedTransactionId = formData.get("transactionId") as string | undefined;
        const recipientType = formData.get("recipientType") as 'Beneficiary' | 'Referral';
        const customRecipientId = formData.get("recipientId") as string | undefined;

        if (!adminUserId || isNaN(amount) || (!proofFile && (formData.get("paymentMethod") === "Bank Transfer" || formData.get("paymentMethod") === "Online (UPI/Card)")) ) {
            return { success: false, error: "Missing required fields for fund transfer (Admin, Amount, Proof for online methods)." };
        }

        const [adminUser, lead] = await Promise.all([
            getUser(adminUserId),
            getLead(leadId)
        ]);

        if (!adminUser || !lead) {
            return { success: false, error: "Admin user or lead not found." };
        }
        
        let recipientId = lead.beneficiaryId;
        if (recipientType === 'Referral' && customRecipientId) {
            recipientId = customRecipientId;
        }
        const recipientUser = await getUser(recipientId);
        if (!recipientUser) {
             return { success: false, error: "Recipient user could not be found." };
        }

        // --- Structured Transfer ID Generation ---
        const timestamp = Date.now();
        const adminKey = adminUser.userKey || 'ADMIN';
        const recipientKey = recipientUser.userKey || 'RECP';
        const transferId = scannedTransactionId || `TXN_By${adminKey}_To${recipientKey}_${timestamp}`;
        // --- End ID Generation ---

        let proofUrl = '';
        if (proofFile) {
            const uploadPath = `leads/${leadId}/transfers/${transferId}/`;
            proofUrl = await uploadFile(proofFile, uploadPath);
        }

        const newTransfer: FundTransfer = {
            transferredByUserId: adminUserId,
            transferredByUserName: adminUser.name,
            amount: amount,
            transferredAt: new Date() as any,
            proofUrl: proofUrl,
            notes: formData.get("notes") as string | undefined,
            transactionId: transferId, // Use the new structured ID
            utrNumber: formData.get("utrNumber") as string | undefined,
            googlePayTransactionId: formData.get("googlePayTransactionId") as string | undefined,
            phonePeTransactionId: formData.get("phonePeTransactionId") as string | undefined,
            paytmUpiReferenceNo: formData.get("paytmUpiReferenceNo") as string | undefined,
            senderName: formData.get("senderName") as string | undefined,
            senderPhone: formData.get("senderPhone") as string | undefined,
            senderAccountNumber: formData.get("senderAccountNumber") as string | undefined,
            senderBankName: formData.get("senderBankName") as string | undefined,
            senderIfscCode: formData.get("senderIfscCode") as string | undefined,
            senderUpiId: formData.get("senderUpiId") as string | undefined,
            recipientName: formData.get("recipientName") as string | undefined,
            recipientPhone: formData.get("recipientPhone") as string | undefined,
            recipientUpiId: formData.get("recipientUpiId") as string | undefined,
            recipientAccountNumber: formData.get("recipientAccountNumber") as string | undefined,
            recipientBankName: formData.get("recipientBankName") as string | undefined,
            recipientIfscCode: formData.get("recipientIfscCode") as string | undefined,
            paymentApp: formData.get("paymentApp") as string | undefined,
            paymentMethod: formData.get("paymentMethod") as string | undefined,
            status: formData.get("status") as string | undefined,
        };

        await updateLead(leadId, {
            fundTransfers: arrayUnion(newTransfer) as any,
            helpGiven: increment(amount),
        });

        await logActivity({
            userId: adminUser.id!,
            userName: adminUser.name,
            userEmail: adminUser.email,
            role: "Admin",
            activity: "Fund Transfer Recorded",
            details: {
                leadId: lead.id!,
                leadName: lead.name,
                amount: amount,
            },
        });

        revalidatePath(`/admin/leads/${leadId}`);
        return { success: true };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred while recording the transfer.";
        console.error("Error handling fund transfer:", error);
        return { success: false, error: `Failed to record fund transfer: ${error}` };
    }
}

export async function handleAllocateDonationsToLead(leadId: string, donationIds: string[], adminUserId: string) {
    try {
        const adminUser = await getUser(adminUserId);
        if (!adminUser) return { success: false, error: "Admin user not found for logging." };
        
        const lead = await getLead(leadId);
        if (!lead) return { success: false, error: "Lead not found." };
        
        let amountNeeded = lead.helpRequested - lead.helpGiven;
        if (amountNeeded <= 0) {
            return { success: false, error: "This lead has already been fully funded." };
        }
        
        const batch = writeBatch(db);
        let totalAllocatedInThisAction = 0;
        
        for (const donationId of donationIds) {
            if (amountNeeded <= 0) break; // Stop if the lead is fully funded
            
            const donation = await getDonation(donationId);
            if (!donation || (donation.status !== 'Verified' && donation.status !== 'Partially Allocated')) {
                continue; // Skip invalid or fully allocated donations
            }

            const alreadyAllocated = donation.allocations?.reduce((sum, alloc) => sum + alloc.amount, 0) || 0;
            const availableAmount = donation.amount - alreadyAllocated;
            if (availableAmount <= 0) continue;

            const amountToAllocate = Math.min(amountNeeded, availableAmount);
            totalAllocatedInThisAction += amountToAllocate;
            amountNeeded -= amountToAllocate;

            // 1. Update Donation
            const donationRef = doc(db, 'donations', donationId);
            const newAllocationForDonation: Allocation = {
                leadId: leadId,
                amount: amountToAllocate,
                allocatedAt: Timestamp.now(),
                allocatedByUserId: adminUser.id!,
                allocatedByUserName: adminUser.name,
            };
            const newDonationStatus = (availableAmount - amountToAllocate < 1) ? 'Allocated' : 'Partially Allocated';
            batch.update(donationRef, {
                allocations: arrayUnion(newAllocationForDonation),
                status: newDonationStatus,
                updatedAt: serverTimestamp()
            });
        }
        
        // 2. Update Lead
        const leadRef = doc(db, 'leads', leadId);
        batch.update(leadRef, {
            helpGiven: increment(totalAllocatedInThisAction),
            updatedAt: serverTimestamp()
        });

        await batch.commit();

        revalidatePath(`/admin/leads/${leadId}`);
        donationIds.forEach(id => revalidatePath(`/admin/donations/${id}/edit`));
        revalidatePath("/admin/donations");

        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred during allocation.";
        console.error("Error allocating donations to lead:", error);
        return { success: false, error: `Failed to allocate donations: ${error}` };
    }
}

