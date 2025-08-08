
"use server";

import { deleteLead, getLead, updateLead } from "@/services/lead-service";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/services/activity-log-service";
import { getUser } from "@/services/user-service";

export async function handleDeleteLead(leadId: string) {
    try {
        await deleteLead(leadId);
        revalidatePath("/admin/leads");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
    }
}

// In a real app, you would upload the file to a storage service like Firebase Storage
// and get a URL. This function is a placeholder.
async function handleFileUpload(file: File): Promise<string> {
    console.log(`Received verification document: ${file.name}, size: ${file.size} bytes`);
    // Placeholder for file upload logic
    return `https://placehold.co/600x400.png?text=verification-doc-placeholder`;
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

        const verificationDocumentUrl = await handleFileUpload(documentFile);

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
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
    }
}
