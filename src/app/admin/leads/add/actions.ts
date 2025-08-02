
"use server";

import { createLead, Lead, LeadPurpose } from "@/services/lead-service";
import { getUser, createUser, User } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import { Timestamp } from "firebase/firestore";

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
      userType: formData.get("userType") as 'existing' | 'new',
      beneficiaryId: formData.get("beneficiaryId") as string | undefined,
      newUserName: formData.get("newUserName") as string | undefined,
      newUserPhone: formData.get("newUserPhone") as string | undefined,
      newUserEmail: formData.get("newUserEmail") as string | undefined,

      purpose: formData.get("purpose") as LeadPurpose,
      subCategory: formData.get("subCategory") as string,
      otherCategoryDetail: formData.get("otherCategoryDetail") as string | undefined,
      helpRequested: parseFloat(formData.get("helpRequested") as string),
      isLoan: formData.get("isLoan") === 'on',
      caseDetails: formData.get("caseDetails") as string,
      verificationDocument: formData.get("verificationDocument") as File | null,
  };
  
  if (!rawFormData.purpose || !rawFormData.subCategory || isNaN(rawFormData.helpRequested)) {
    return { success: false, error: "Missing required lead details fields." };
  }

  try {
    let beneficiaryUser: User | null = null;
    
    if (rawFormData.userType === 'existing') {
        if (!rawFormData.beneficiaryId) return { success: false, error: "Beneficiary ID is required for existing user."};
        beneficiaryUser = await getUser(rawFormData.beneficiaryId);
        if (!beneficiaryUser) {
            return { success: false, error: "Selected beneficiary user not found." };
        }
    } else { // New user
        if (!rawFormData.newUserName || !rawFormData.newUserPhone) {
             return { success: false, error: "New user name and phone are required."};
        }
        try {
            const newUser: Omit<User, 'id'> = {
                name: rawFormData.newUserName,
                phone: rawFormData.newUserPhone,
                email: rawFormData.newUserEmail || '',
                roles: ['Beneficiary'], // Default role
                isActive: true,
                createdAt: Timestamp.now(),
            };
            beneficiaryUser = await createUser(newUser);
        } catch (e) {
            const error = e instanceof Error ? e.message : "An unknown error occurred creating the user.";
            return { success: false, error };
        }
    }
      
    let verificationDocumentUrl = "";
    if (rawFormData.verificationDocument && rawFormData.verificationDocument.size > 0) {
        verificationDocumentUrl = await handleFileUpload(rawFormData.verificationDocument);
    }
    
    const newLeadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'helpGiven' | 'status' | 'verifiedStatus' | 'verifiers' | 'dateCreated' | 'adminAddedBy' | 'category' | 'donations'> = {
        name: beneficiaryUser.name,
        beneficiaryId: beneficiaryUser.id!,
        purpose: rawFormData.purpose,
        subCategory: rawFormData.subCategory,
        otherCategoryDetail: rawFormData.subCategory === 'Other' ? rawFormData.otherCategoryDetail : undefined,
        helpRequested: rawFormData.helpRequested,
        isLoan: rawFormData.isLoan,
        caseDetails: rawFormData.caseDetails,
        verificationDocumentUrl,
    };

    const newLead = await createLead(newLeadData, adminUserId);
    
    revalidatePath("/admin/leads");
    revalidatePath("/admin/leads/add"); // To refresh the user list

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
