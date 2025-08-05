

"use server";

import { getLead, updateLead, Lead, LeadPurpose, LeadStatus, LeadVerificationStatus, DonationType } from "@/services/lead-service";
import { revalidatePath } from "next/cache";
import { Timestamp, arrayUnion } from "firebase/firestore";
import type { User, Verifier } from "@/services/types";
import { getUser } from "@/services/user-service";


interface FormState {
    success: boolean;
    error?: string;
}

const purposeCategoryMap: Record<LeadPurpose, DonationType> = {
    'Education': 'Sadaqah',
    'Medical': 'Sadaqah',
    'Relief Fund': 'Lillah',
    'Deen': 'Sadaqah',
    'Other': 'Sadaqah',
};

export async function handleUpdateLead(
  leadId: string,
  formData: FormData,
  adminUserId: string,
): Promise<FormState> {
  const rawFormData = Object.fromEntries(formData.entries());

  try {
    const lead = await getLead(leadId);
    if (!lead) {
        return { success: false, error: "Lead not found." };
    }
    
    const adminUser = await getUser(adminUserId);
    if (!adminUser) {
        return { success: false, error: "Admin user not found." };
    }

    const purpose = rawFormData.purpose as LeadPurpose;
    const status = rawFormData.status as LeadStatus;
    const verifiedStatus = rawFormData.verifiedStatus as LeadVerificationStatus;
    const campaignId = rawFormData.campaignId as string | undefined;
    const campaignName = rawFormData.campaignName as string | undefined;

    const updates: Partial<Lead> = {
        campaignId: campaignId,
        campaignName: campaignName,
        purpose: purpose,
        otherPurposeDetail: rawFormData.otherPurposeDetail as string | undefined,
        donationType: purposeCategoryMap[purpose], // Infer category from purpose
        category: rawFormData.category as string | undefined,
        otherCategoryDetail: rawFormData.otherCategoryDetail as string | undefined,
        acceptableDonationTypes: formData.getAll("acceptableDonationTypes") as DonationType[],
        helpRequested: parseFloat(rawFormData.helpRequested as string),
        dueDate: rawFormData.dueDate ? new Date(rawFormData.dueDate as string) : undefined,
        caseDetails: rawFormData.caseDetails as string | undefined,
        isLoan: rawFormData.isLoan === 'on',
        status: status,
        verifiedStatus: verifiedStatus,
    };
    
    if (status === 'Closed' && lead.status !== 'Closed') {
        updates.closedAt = Timestamp.now();
    }
    
    if (verifiedStatus === 'Verified' && lead.verifiedStatus !== 'Verified') {
        const newVerifier: Verifier = {
            verifierId: adminUser.id!,
            verifierName: adminUser.name,
            verifiedAt: Timestamp.now(),
            notes: "Verified through edit form."
        };
        // Use arrayUnion to add the verifier without duplicates
        updates.verifiers = arrayUnion(newVerifier) as any;
    }

    await updateLead(leadId, updates);
    
    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${leadId}`);
    revalidatePath(`/admin/leads/${leadId}/edit`);

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating lead:", error);
    return {
      success: false,
      error: error,
    };
  }
}
