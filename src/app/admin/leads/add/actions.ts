
"use server";

import { createLead, Lead, LeadPurpose } from "@/services/lead-service";
import { getUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";

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

export async function handleAddLead(
  formData: FormData
): Promise<FormState> {
  // In a real app, you'd get the logged-in user's ID here.
  const adminUserId = "user_placeholder_id_12345";
  
  const rawFormData = {
      beneficiaryId: formData.get("beneficiaryId") as string,
      purpose: formData.get("purpose") as LeadPurpose,
      subCategory: formData.get("subCategory") as string,
      otherCategoryDetail: formData.get("otherCategoryDetail") as string | undefined,
      helpRequested: parseFloat(formData.get("helpRequested") as string),
      isLoan: formData.get("isLoan") === 'true',
      caseDetails: formData.get("caseDetails") as string,
      verificationDocument: formData.get("verificationDocument") as File | null,
  };
  
  if (!rawFormData.beneficiaryId || !rawFormData.purpose || !rawFormData.subCategory || isNaN(rawFormData.helpRequested)) {
    return { success: false, error: "Missing required fields." };
  }

  try {
    const beneficiaryUser = await getUser(rawFormData.beneficiaryId);
    if (!beneficiaryUser) {
        return { success: false, error: "Selected beneficiary user not found." };
    }
      
    let verificationDocumentUrl = "";
    if (rawFormData.verificationDocument && rawFormData.verificationDocument.size > 0) {
        verificationDocumentUrl = await handleFileUpload(rawFormData.verificationDocument);
    }
    
    const newLeadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'helpGiven' | 'status' | 'verifiedStatus' | 'verifiers' | 'dateCreated' | 'adminAddedBy' | 'category'> = {
        name: beneficiaryUser.name,
        beneficiaryId: rawFormData.beneficiaryId,
        purpose: rawFormData.purpose,
        subCategory: rawFormData.subCategory,
        otherCategoryDetail: rawFormData.otherCategoryDetail,
        helpRequested: rawFormData.helpRequested,
        isLoan: rawFormData.isLoan,
        caseDetails: rawFormData.caseDetails,
        verificationDocumentUrl,
    };

    const newLead = await createLead(newLeadData, adminUserId);
    
    revalidatePath("/admin/leads");

    return {
      success: true,
      lead: newLead,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error adding lead:", error);
    return {
      success: false,
      error: error,
    };
  }
}
