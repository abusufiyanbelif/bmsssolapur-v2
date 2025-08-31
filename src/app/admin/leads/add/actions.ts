

"use server";

import { createLead, getOpenLeadsByBeneficiaryId, updateLead } from "@/services/lead-service";
import { getUser, createUser, checkAvailability } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import type { Lead, LeadPurpose, User, DonationType, Campaign, LeadPriority, ExtractLeadDetailsOutput } from "@/services/types";
import { Timestamp } from "firebase/firestore";
import { getAppSettings } from "@/services/app-settings-service";
import { extractLeadDetailsFromText } from "@/ai/flows/extract-lead-details-from-text-flow";
import { uploadFile } from "@/services/storage-service";

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
      referredByUserId: formData.get("referredByUserId") as string | undefined,
      referredByUserName: formData.get("referredByUserName") as string | undefined,
      headline: formData.get("headline") as string | undefined,
      story: formData.get("story") as string | undefined,
      purpose: formData.get("purpose") as LeadPurpose,
      otherPurposeDetail: formData.get("otherPurposeDetail") as string | undefined,
      category: formData.get("category") as string,
      otherCategoryDetail: formData.get("otherCategoryDetail") as string | undefined,
      priority: formData.get("priority") as LeadPriority,
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
    const [adminUser, settings] = await Promise.all([
        getUser(adminUserId),
        getAppSettings()
    ]);
    
    if (!adminUser) {
        return { success: false, error: "Admin user not found for logging." };
    }

    const approvalProcessDisabled = settings.leadConfiguration?.approvalProcessDisabled || false;
    const userHasOverride = adminUser?.groups?.some(g => ['Founder', 'Co-Founder', 'Finance'].includes(g));

    if (approvalProcessDisabled && !userHasOverride) {
        return { success: false, error: "Lead approval process is disabled. Only authorized users can create leads." };
    }

    let beneficiaryUser: User | null = null;
    
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
      
    // Create lead first to get its ID for the file path
    const newLeadData: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>> = {
        name: beneficiaryUser.name,
        beneficiaryId: beneficiaryUser.id!,
        campaignId: rawFormData.campaignId === 'none' ? undefined : rawFormData.campaignId,
        campaignName: rawFormData.campaignName || undefined,
        headline: rawFormData.headline,
        story: rawFormData.story,
        purpose: rawFormData.purpose,
        otherPurposeDetail: rawFormData.purpose === 'Other' ? rawFormData.otherPurposeDetail : undefined,
        donationType: purposeCategoryMap[rawFormData.purpose],
        acceptableDonationTypes: rawFormData.acceptableDonationTypes,
        category: rawFormData.category,
        otherCategoryDetail: rawFormData.category === 'Other' ? rawFormData.otherCategoryDetail : undefined,
        priority: rawFormData.priority,
        helpRequested: rawFormData.helpRequested,
        helpGiven: 0,
        caseStatus: approvalProcessDisabled ? 'Open' : 'Pending',
        caseAction: approvalProcessDisabled ? 'Ready For Help' : 'Pending',
        caseVerification: approvalProcessDisabled ? 'Verified' : 'Pending',
        verifiers: approvalProcessDisabled ? [{ verifierId: adminUser.id!, verifierName: adminUser.name, verifiedAt: Timestamp.now(), notes: 'Auto-verified (approval process disabled).' }] : [],
        donations: [],
        caseDetails: rawFormData.caseDetails,
        adminAddedBy: { id: adminUser.id!, name: adminUser.name },
        referredByUserId: rawFormData.referredByUserId || undefined,
        referredByUserName: rawFormData.referredByUserName || undefined,
        dateCreated: Timestamp.now(),
        dueDate: rawFormData.dueDate ? Timestamp.fromDate(rawFormData.dueDate) : undefined,
        isLoan: rawFormData.isLoan,
        source: 'Manual Entry'
    };

    const newLead = await createLead(newLeadData, { id: adminUser.id!, name: adminUser.name });
    
    // Now upload file with the new lead's ID
    if (rawFormData.verificationDocument && rawFormData.verificationDocument.size > 0) {
        const uploadPath = `leads/${newLead.id}/documents/`;
        const verificationDocumentUrl = await uploadFile(rawFormData.verificationDocument, uploadPath);
        // Update the lead with the document URL
        await updateLead(newLead.id!, { verificationDocumentUrl });
        newLead.verificationDocumentUrl = verificationDocumentUrl;
    }
    
    revalidatePath("/admin/leads");
    revalidatePath("/admin/leads/add");
    revalidatePath("/admin");

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

export async function handleExtractLeadDetailsFromText(rawText: string): Promise<{ success: boolean; details?: ExtractLeadDetailsOutput; error?: string }> {
    try {
        const extractedDetails = await extractLeadDetailsFromText({ rawText });
        return { success: true, details: extractedDetails };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown AI error occurred.";
        console.error("Error extracting lead details from text:", error);
        return { success: false, error };
    }
}
