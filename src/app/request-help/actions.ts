
"use server";

import { createLead } from "@/services/lead-service";
import { getUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import type { Lead } from "@/services/types";

interface FormState {
    success: boolean;
    error?: string;
    lead?: Lead;
}

// In a real app, you would upload the file to a storage service like Firebase Storage
// and get a URL. For this prototype, we'll just acknowledge the file was received.
async function handleFileUpload(file: File): Promise<string> {
    console.log(`Received file for verification: ${file.name}, size: ${file.size} bytes`);
    // Placeholder for file upload logic
    return `https://placehold.co/600x400.png?text=verification-doc`;
}

export async function handleRequestHelp(
  formData: FormData,
  userId: string
): Promise<FormState> {
  const rawFormData = {
      category: formData.get("category") as any,
      helpRequested: parseFloat(formData.get("helpRequested") as string),
      caseDetails: formData.get("caseDetails") as string,
      verificationDocument: formData.get("verificationDocument") as File | null,
  };
  
  if (!userId || !rawFormData.category || isNaN(rawFormData.helpRequested)) {
    return { success: false, error: "Missing required fields." };
  }

  try {
    const beneficiaryUser = await getUser(userId);
    if (!beneficiaryUser) {
        return { success: false, error: "Beneficiary user not found." };
    }
      
    let verificationDocumentUrl = "";
    if (rawFormData.verificationDocument && rawFormData.verificationDocument.size > 0) {
        verificationDocumentUrl = await handleFileUpload(rawFormData.verificationDocument);
    }
    
    const newLeadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'helpGiven' | 'status' | 'verifiedStatus' | 'verifiers' | 'dateCreated' | 'adminAddedBy' | 'isLoan' | 'purpose' | 'subCategory'> = {
        name: beneficiaryUser.name,
        beneficiaryId: userId,
        category: rawFormData.category,
        helpRequested: rawFormData.helpRequested,
        caseDetails: rawFormData.caseDetails,
        verificationDocumentUrl,
    };

    const newLead = await createLead({ ...newLeadData, isLoan: false, purpose: 'Relief Fund' }, userId);
    
    revalidatePath("/my-cases");

    return {
      success: true,
      lead: newLead,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error creating lead from user request:", error);
    return {
      success: false,
      error: error,
    };
  }
}
