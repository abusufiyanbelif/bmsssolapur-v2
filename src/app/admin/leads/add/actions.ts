

"use server";

import { createLead, getOpenLeadsByBeneficiaryId, updateLead } from "@/services/lead-service";
import { getUser, createUser, checkAvailability, updateUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import type { Lead, LeadPurpose, User, DonationType, Campaign, LeadPriority, ExtractLeadDetailsOutput, ExtractBeneficiaryDetailsOutput, GenerateSummariesOutput } from "@/services/types";
import { Timestamp } from "firebase/firestore";
import { getAppSettings } from "@/services/app-settings-service";
import { extractLeadDetailsFromText as extractLeadDetailsFlow } from "@/ai/flows/extract-lead-details-from-text-flow";
import { extractBeneficiaryDetails as extractBeneficiaryDetailsFlow } from "@/ai/flows/extract-beneficiary-details-flow";
import { uploadFile } from "@/services/storage-service";
import { generateSummaries as generateSummariesFlow } from "@/ai/flows/generate-summaries-flow";

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
      linkBeneficiaryLater: formData.get("linkBeneficiaryLater") === 'on',
      manualBeneficiaryName: formData.get("manualBeneficiaryName") as string | undefined,
      newBeneficiaryUserId: formData.get("newBeneficiaryUserId") as string | undefined,
      newBeneficiaryFirstName: formData.get("newBeneficiaryFirstName") as string | undefined,
      newBeneficiaryMiddleName: formData.get("newBeneficiaryMiddleName") as string | undefined,
      newBeneficiaryLastName: formData.get("newBeneficiaryLastName") as string | undefined,
      newBeneficiaryFatherName: formData.get("newBeneficiaryFatherName") as string | undefined,
      newBeneficiaryPhone: formData.get("newBeneficiaryPhone") as string | undefined,
      newBeneficiaryEmail: formData.get("newBeneficiaryEmail") as string | undefined,
      newBeneficiaryAadhaar: formData.get("newBeneficiaryAadhaar") as string | undefined,
      gender: formData.get("gender") as 'Male' | 'Female' | 'Other' | undefined,
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
      fundingGoal: formData.get("fundingGoal") ? parseFloat(formData.get("fundingGoal") as string) : undefined,
      collectedAmount: formData.get("collectedAmount") ? parseFloat(formData.get("collectedAmount") as string) : undefined,
      caseReportedDate: formData.get("caseReportedDate") ? new Date(formData.get("caseReportedDate") as string) : undefined,
      dueDate: formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : undefined,
      isLoan: formData.get("isLoan") === 'on',
      isHistoricalRecord: formData.get("isHistoricalRecord") === 'on',
      caseDetails: formData.get("caseDetails") as string,
      aadhaarCard: formData.get("aadhaarCard") as File | null,
      addressProof: formData.get("addressProof") as File | null,
      otherDocuments: formData.getAll("otherDocuments") as File[],
      forceCreate: formData.get("forceCreate") === 'true',
      degree: formData.get("degree") as string | undefined,
      year: formData.get("year") as string | undefined,
      semester: formData.get("semester") as string | undefined,
      // Address fields for new user
      addressLine1: formData.get("addressLine1") as string | undefined,
      city: formData.get("city") as string | undefined,
      state: formData.get("state") as string | undefined,
      pincode: formData.get("pincode") as string | undefined,
      country: formData.get("country") as string | undefined,
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
    const userHasOverride = adminUser?.roles?.includes('Super Admin');

    if (approvalProcessDisabled && !userHasOverride) {
        return { success: false, error: "Lead approval process is disabled. Only Super Admins can create leads at this time." };
    }

    let beneficiaryUser: User | null = null;
    let leadName: string;
    let wasBeneficiaryCreated = false;

    if (rawFormData.linkBeneficiaryLater) {
        if (!rawFormData.manualBeneficiaryName) {
            return { success: false, error: "Beneficiary Name is required when linking later." };
        }
        leadName = rawFormData.manualBeneficiaryName;
    } else {
        if (rawFormData.beneficiaryType === 'new') {
            const { newBeneficiaryUserId, newBeneficiaryFirstName, newBeneficiaryMiddleName, newBeneficiaryLastName, newBeneficiaryPhone, newBeneficiaryEmail, newBeneficiaryAadhaar, newBeneficiaryFatherName, gender, addressLine1, city, state, pincode, country } = rawFormData;
            
            if (!newBeneficiaryFirstName || !newBeneficiaryLastName || !newBeneficiaryPhone || !gender) {
                return { success: false, error: "New beneficiary requires First Name, Last Name, Phone, and Gender." };
            }
            
            try {
                const newUserPayload: Partial<User> = {
                    userId: newBeneficiaryUserId,
                    name: `${newBeneficiaryFirstName} ${newBeneficiaryMiddleName || ''} ${newBeneficiaryLastName}`.replace(/\s+/g, ' ').trim(),
                    firstName: newBeneficiaryFirstName,
                    middleName: newBeneficiaryMiddleName || '',
                    lastName: newBeneficiaryLastName,
                    fatherName: newBeneficiaryFatherName || undefined,
                    phone: newBeneficiaryPhone,
                    email: newBeneficiaryEmail || undefined,
                    aadhaarNumber: newBeneficiaryAadhaar || undefined,
                    gender: gender,
                    roles: ['Beneficiary'],
                    isActive: true,
                    address: {
                        addressLine1: addressLine1,
                        city: city,
                        state: state,
                        pincode: pincode,
                        country: country
                    }
                };

                beneficiaryUser = await createUser(newUserPayload);
                wasBeneficiaryCreated = true;
            } catch (e) {
                 const error = e instanceof Error ? e.message : "An unknown error occurred while creating the new beneficiary.";
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
        leadName = beneficiaryUser.name;
        
        // Duplicate Lead Check only if a beneficiary is linked
        if (!rawFormData.forceCreate) {
            const openLeads = await getOpenLeadsByBeneficiaryId(beneficiaryUser.id!);
            if (openLeads.length > 0) {
                return { success: false, duplicateLeadWarning: openLeads };
            }
        }
    }
      
    const newLeadData: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>> = {
        name: leadName,
        beneficiaryId: beneficiaryUser?.id,
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
        fundingGoal: rawFormData.fundingGoal || rawFormData.helpRequested,
        collectedAmount: rawFormData.isHistoricalRecord ? rawFormData.collectedAmount : 0,
        helpGiven: rawFormData.isHistoricalRecord ? rawFormData.collectedAmount : 0,
        caseStatus: rawFormData.isHistoricalRecord ? 'Closed' : (approvalProcessDisabled ? 'Open' : 'Pending'),
        caseAction: rawFormData.isHistoricalRecord ? 'Closed' : (approvalProcessDisabled ? 'Ready For Help' : 'Pending'),
        caseVerification: approvalProcessDisabled ? 'Verified' : 'Pending',
        verifiers: approvalProcessDisabled ? [{ verifierId: adminUser.id!, verifierName: adminUser.name, verifiedAt: Timestamp.now(), notes: 'Auto-verified (approval process disabled).' }] : [],
        donations: [],
        caseDetails: rawFormData.caseDetails,
        adminAddedBy: { id: adminUser.id!, name: adminUser.name },
        referredByUserId: rawFormData.referredByUserId || undefined,
        referredByUserName: rawFormData.referredByUserName || undefined,
        dateCreated: Timestamp.now(),
        caseReportedDate: rawFormData.caseReportedDate ? Timestamp.fromDate(rawFormData.caseReportedDate) : undefined,
        dueDate: rawFormData.dueDate ? Timestamp.fromDate(rawFormData.dueDate as any) : undefined,
        isLoan: rawFormData.isLoan,
        isHistoricalRecord: rawFormData.isHistoricalRecord,
        source: 'Manual Entry',
        degree: rawFormData.degree,
        year: rawFormData.year,
        semester: rawFormData.semester,
    };

    const newLead = await createLead(newLeadData, { id: adminUser.id!, name: adminUser.name });
    
    // Now upload files with the new lead's ID
    const uploadPromises: Promise<string | null>[] = [
        rawFormData.aadhaarCard ? uploadFile(rawFormData.aadhaarCard, `leads/${newLead.id}/documents/`) : Promise.resolve(null),
    ];

    if (rawFormData.otherDocuments && rawFormData.otherDocuments.length > 0) {
        rawFormData.otherDocuments.forEach(file => {
            uploadPromises.push(uploadFile(file, `leads/${newLead.id}/documents/`));
        });
    }

    const [aadhaarUrl, ...otherUrls] = await Promise.all(uploadPromises);
    
    const leadDocUpdates: Partial<Lead> = {};
    if (aadhaarUrl) leadDocUpdates.aadhaarCardUrl = aadhaarUrl;
    
    if (otherUrls.length > 0) {
        leadDocUpdates.otherDocument1Url = otherUrls[0] || undefined;
        if (otherUrls.length > 1) {
             leadDocUpdates.otherDocument2Url = otherUrls[1] || undefined;
        }
    }
    
    if(Object.keys(leadDocUpdates).length > 0) {
      await updateLead(newLead.id!, leadDocUpdates);
      Object.assign(newLead, leadDocUpdates);
    }
    
    // If a new beneficiary was created and an Aadhaar was uploaded, update the user profile as well.
    if (wasBeneficiaryCreated && beneficiaryUser && aadhaarUrl) {
      await updateUser(beneficiaryUser.id!, { aadhaarCardUrl: aadhaarUrl });
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

export async function handleExtractLeadDetailsFromText(
    rawText: string, 
    context: {
        purpose?: string; 
        category?: string;
        degree?: string;
        year?: string;
        semester?: string;
    }
): Promise<{ success: boolean; details?: ExtractLeadDetailsOutput; error?: string }> {
    try {
        const extractedDetails = await extractLeadDetailsFlow({ 
            rawText, 
            ...context
        });
        return { success: true, details: extractedDetails };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown AI error occurred.";
        console.error("Error extracting lead details from text:", error);
        return { success: false, error };
    }
}

export async function handleExtractLeadBeneficiaryDetailsFromText(
    rawText: string,
    fieldsToFind?: (keyof ExtractBeneficiaryDetailsOutput)[]
): Promise<{ success: boolean; details?: ExtractBeneficiaryDetailsOutput; error?: string }> {
    try {
        const extractedDetails = await extractBeneficiaryDetailsFlow({ rawText, fieldsToFind });
        return { success: true, details: extractedDetails };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown AI error occurred.";
        console.error("Error extracting beneficiary details from text:", error);
        return { success: false, error };
    }
}

export async function handleGenerateSummaries(rawText: string): Promise<{ success: boolean; summaries?: GenerateSummariesOutput; error?: string }> {
    try {
        const summaryOptions = await generateSummariesFlow({ rawText });
        return { success: true, summaries: summaryOptions };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown AI error occurred.";
        return { success: false, error };
    }
}
    






