

"use server";

import { createLead, getOpenLeadsByBeneficiaryId } from "@/services/lead-service";
import { getUser, createUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import type { Lead, LeadPurpose, User, DonationType, Campaign } from "@/services/types";
import { Timestamp } from "firebase/firestore";

interface FormState {
    success: boolean;
    error?: string;
    lead?: Lead;
    duplicateLeadWarning?: Lead[];
}

const purposeCategoryMap: Record<LeadPurpose, DonationType> = {
    'Education': 'Sadaqah',
    'Medical': 'Sadaqah',
    'Relief Fund': 'Lillah',
    'Deen': 'Sadaqah',
    'Loan': 'Lillah', // Loans are a form of Lillah
    'Other': 'Sadaqah',
};

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
  const adminUserId = formData.get("adminUserId") as string;
  if (!adminUserId) {
    return { success: false, error: "Could not identify the admin performing this action." };
  }
  
  const rawFormData = {
      beneficiaryType: formData.get("beneficiaryType") as 'existing' | 'new',
      beneficiaryId: formData.get("beneficiaryId") as string | undefined,
      newBeneficiaryFirstName: formData.get("newBeneficiaryFirstName") as string | undefined,
      newBeneficiaryMiddleName: formData.get("newBeneficiaryMiddleName") as string | undefined,
      newBeneficiaryLastName: formData.get("newBeneficiaryLastName") as string | undefined,
      newBeneficiaryPhone: formData.get("newBeneficiaryPhone") as string | undefined,
      newBeneficiaryEmail: formData.get("newBeneficiaryEmail") as string | undefined,
      campaignId: formData.get("campaignId") as string | undefined,
      campaignName: formData.get("campaignName") as string | undefined,
      purpose: formData.get("purpose") as LeadPurpose,
      otherPurposeDetail: formData.get("otherPurposeDetail") as string | undefined,
      category: formData.get("category") as string,
      otherCategoryDetail: formData.get("otherCategoryDetail") as string | undefined,
      acceptableDonationTypes: formData.getAll("acceptableDonationTypes") as DonationType[],
      helpRequested: parseFloat(formData.get("helpRequested") as string),
      dueDate: formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : undefined,
      isLoan: formData.get("isLoan") === 'on',
      caseDetails: formData.get("caseDetails") as string,
      verificationDocument: formData.get("verificationDocument") as File | null,
      forceCreate: formData.get("forceCreate") === 'true',
  };
  
  if (!rawFormData.purpose || !rawFormData.category || isNaN(rawFormData.helpRequested)) {
    return { success: false, error: "Missing required lead details fields." };
  }

  try {
    let beneficiaryUser: User | null = null;
    const adminUser = await getUser(adminUserId);

    if (!adminUser) {
        return { success: false, error: "Admin user not found for logging." };
    }
    
    if (rawFormData.beneficiaryType === 'new') {
        const { newBeneficiaryFirstName, newBeneficiaryMiddleName, newBeneficiaryLastName, newBeneficiaryPhone, newBeneficiaryEmail } = rawFormData;

        if (!newBeneficiaryFirstName || !newBeneficiaryLastName || !newBeneficiaryPhone) {
            return { success: false, error: "New beneficiary First Name, Last Name, and Phone number are required." };
        }
        
        const newBeneficiaryName = `${newBeneficiaryFirstName} ${newBeneficiaryMiddleName || ''} ${newBeneficiaryLastName}`.replace(/\s+/g, ' ').trim();

        try {
            beneficiaryUser = await createUser({
                name: newBeneficiaryName,
                firstName: newBeneficiaryFirstName,
                middleName: newBeneficiaryMiddleName || '',
                lastName: newBeneficiaryLastName,
                phone: newBeneficiaryPhone,
                email: newBeneficiaryEmail || `${newBeneficiaryPhone}@example.com`,
                roles: ['Beneficiary'],
                isActive: true,
                createdAt: Timestamp.now(),
            });
        } catch (e) {
             const error = e instanceof Error ? e.message : "An unknown error occurred while creating the new beneficiary.";
             console.error("Error creating new beneficiary from lead form:", error);
             return { success: false, error };
        }
    } else {
        if (!rawFormData.beneficiaryId) {
             return { success: false, error: "Please select an existing beneficiary." };
        }
        beneficiaryUser = await getUser(rawFormData.beneficiaryId);
    }
    
    if (!beneficiaryUser) {
        return { success: false, error: "Could not find or create the beneficiary user." };
    }

    // Duplicate Lead Check
    if (!rawFormData.forceCreate) {
        const openLeads = await getOpenLeadsByBeneficiaryId(beneficiaryUser.id!);
        if (openLeads.length > 0) {
            return {
                success: false,
                duplicateLeadWarning: openLeads,
            };
        }
    }
      
    let verificationDocumentUrl: string | undefined;
    if (rawFormData.verificationDocument && rawFormData.verificationDocument.size > 0) {
        verificationDocumentUrl = await handleFileUpload(rawFormData.verificationDocument);
    }
    
    const newLeadData = {
        name: beneficiaryUser.name,
        beneficiaryId: beneficiaryUser.id!,
        campaignId: rawFormData.campaignId === 'none' ? undefined : rawFormData.campaignId,
        campaignName: rawFormData.campaignName || undefined,
        purpose: rawFormData.purpose,
        otherPurposeDetail: rawFormData.purpose === 'Other' ? rawFormData.otherPurposeDetail : undefined,
        donationType: purposeCategoryMap[rawFormData.purpose], // Infer category from purpose
        category: rawFormData.category,
        otherCategoryDetail: rawFormData.category === 'Other' ? rawFormData.otherCategoryDetail : undefined,
        acceptableDonationTypes: rawFormData.acceptableDonationTypes,
        helpRequested: rawFormData.helpRequested,
        dueDate: rawFormData.dueDate,
        isLoan: rawFormData.isLoan,
        caseDetails: rawFormData.caseDetails,
        verificationDocumentUrl,
    };

    const newLead = await createLead(newLeadData, { id: adminUser.id!, name: adminUser.name });
    
    revalidatePath("/admin/leads");
    revalidatePath("/admin/leads/add"); // To refresh the user list if a new one was added

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
