
"use server";

import { deleteLead, updateLead } from "@/services/lead-service";
import { revalidatePath } from "next/cache";

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
        if (!documentFile || documentFile.size === 0) {
            return { success: false, error: "No file was uploaded." };
        }

        const verificationDocumentUrl = await handleFileUpload(documentFile);

        await updateLead(leadId, { verificationDocumentUrl });
        
        revalidatePath(`/admin/leads/${leadId}`);
        
        return { success: true, url: verificationDocumentUrl };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
    }
}
