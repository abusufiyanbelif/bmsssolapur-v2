

"use server";

import { createLead } from "@/services/lead-service";
import { getUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import type { Lead, DonationType } from "@/services/types";
import { uploadFile } from "@/services/storage-service";

interface FormState {
    success: boolean;
    error?: string;
    lead?: Lead;
}

const categoryToPurposeMap: Record<string, 'Education' | 'Medical' | 'Relief Fund' | 'Deen'> = {
    'Zakat': 'Relief Fund',
    'Sadaqah': 'Relief Fund',
    'Fitr': 'Relief Fund',
    'Education Fees': 'Education',
    'Medical Bill': 'Medical',
    'Ration Kit': 'Relief Fund',
}


export async function handleRequestHelp(
  formData: FormData,
  userId: string
): Promise<FormState> {
  const rawFormData = {
      category: formData.get("category") as string, // This is a blended field now
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
        verificationDocumentUrl = await uploadFile(rawFormData.verificationDocument, 'verification-documents/');
    }
    
    const newLeadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'helpGiven' | 'status' | 'verifiedStatus' | 'verifiers' | 'dateCreated' | 'adminAddedBy' | 'isLoan' | 'donations' | 'campaignName' | 'otherCategoryDetail'> = {
        name: beneficiaryUser.name,
        beneficiaryId: userId,
        donationType: 'Sadaqah', // Defaulting to Sadaqah, can be adjusted
        purpose: categoryToPurposeMap[rawFormData.category] || 'Relief Fund',
        category: rawFormData.category,
        helpRequested: rawFormData.helpRequested,
        caseDetails: rawFormData.caseDetails,
        verificationDocumentUrl,
    };

    const newLead = await createLead(newLeadData, { id: userId, name: beneficiaryUser.name });
    
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
      error: `Failed to create request: ${error}`,
    };
  }
}
