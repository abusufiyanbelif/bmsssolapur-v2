
"use server";

import { getLead, updateLead, Lead, LeadPurpose, LeadStatus, LeadVerificationStatus, DonationType, LeadAction } from "@/services/lead-service";
import { revalidatePath } from "next/cache";
import { Timestamp, arrayUnion } from "firebase/firestore";
import type { User, Verifier } from "@/services/types";
import { getUser } from "@/services/user-service";
import { logActivity } from "@/services/activity-log-service";
import { updatePublicLead } from "@/services/public-data-service";
import { getCampaign } from "@/services/campaign-service";


interface FormState {
    success: boolean;
    error?: string;
}

// Helper function to find differences between two objects for logging
const getChangedFields = (original: Lead, updates: Partial<Lead>) => {
    const changes: Record<string, { from: any; to: any }> = {};
    for (const key in updates) {
        const typedKey = key as keyof Lead;
        const originalValue = original[typedKey];
        const updatedValue = updates[typedKey];

        // Simple comparison for most fields
        if (String(originalValue) !== String(updatedValue)) {
            if (originalValue instanceof Date && updatedValue instanceof Date) {
                if (originalValue?.getTime() !== updatedValue?.getTime()) {
                    changes[typedKey] = {
                        from: originalValue?.toISOString().split('T')[0] || 'N/A',
                        to: updatedValue?.toISOString().split('T')[0] || 'N/A',
                    };
                }
            } else if (Array.isArray(originalValue) && Array.isArray(updatedValue)) {
                 if (JSON.stringify(originalValue.sort()) !== JSON.stringify(updatedValue.sort())) {
                    changes[typedKey] = {
                        from: originalValue.join(', ') || '[]',
                        to: updatedValue.join(', ') || '[]'
                    };
                }
            }
            else {
                changes[typedKey] = {
                    from: originalValue || "N/A",
                    to: updatedValue,
                };
            }
        }
    }
    return changes;
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
    const caseAction = rawFormData.caseAction as LeadAction;
    const verifiedStatus = rawFormData.verifiedStatus as LeadVerificationStatus;
    
    const beneficiaryId = rawFormData.beneficiaryId as string | undefined;
    const referredByUserId = rawFormData.referredByUserId as string | undefined;

    const campaignId = rawFormData.campaignId as string | undefined;
    let campaignName: string | undefined;
    if (campaignId && campaignId !== 'none') {
        const campaign = await getCampaign(campaignId);
        campaignName = campaign?.name;
    }

    const dueDateRaw = rawFormData.dueDate as string | undefined;
    const verificationDueDateRaw = rawFormData.verificationDueDate as string | undefined;
    const dueDate = dueDateRaw ? new Date(dueDateRaw) : undefined;
    const verificationDueDate = verificationDueDateRaw ? new Date(verificationDueDateRaw) : undefined;

    const updates: Partial<Lead> = {
        name: rawFormData.name as string | undefined,
        beneficiaryId: beneficiaryId || undefined,
        referredByUserId: referredByUserId || undefined,
        campaignId: campaignId === 'none' ? undefined : campaignId,
        campaignName: campaignId === 'none' ? undefined : campaignName,
        headline: rawFormData.headline as string | undefined,
        story: rawFormData.story as string | undefined,
        purpose: purpose,
        otherPurposeDetail: rawFormData.otherPurposeDetail as string | undefined,
        category: rawFormData.category as string | undefined,
        otherCategoryDetail: rawFormData.otherCategoryDetail as string | undefined,
        acceptableDonationTypes: formData.getAll("acceptableDonationTypes") as DonationType[],
        helpRequested: parseFloat(rawFormData.helpRequested as string),
        fundingGoal: parseFloat(rawFormData.fundingGoal as string),
        dueDate: dueDate,
        verificationDueDate: verificationDueDate,
        caseDetails: rawFormData.caseDetails as string | undefined,
        isLoan: rawFormData.isLoan === 'on',
        status: status,
        caseAction: caseAction,
        verifiedStatus: verifiedStatus,
        degree: rawFormData.degree as string | undefined,
        year: rawFormData.year as string | undefined,
        semester: rawFormData.semester as string | undefined,
        priority: rawFormData.priority as Lead['priority'],
        diseaseIdentified: rawFormData.diseaseIdentified as string | undefined,
        diseaseStage: rawFormData.diseaseStage as string | undefined,
        diseaseSeriousness: rawFormData.diseaseSeriousness as Lead['diseaseSeriousness'],
    };
    
    // If a beneficiary is being linked for the first time, update the lead name
    if (beneficiaryId && !lead.beneficiaryId) {
        const newBeneficiary = await getUser(beneficiaryId);
        if (newBeneficiary) {
            updates.name = newBeneficiary.name;
        }
    }
    
    const changes = getChangedFields(lead, updates);
    
    if (caseAction === 'Closed' && lead.caseAction !== 'Closed') {
        updates.closedAt = Timestamp.now();
    }
    
    if (verifiedStatus === 'Verified' && lead.verifiedStatus !== 'Verified') {
        const newVerifier: Verifier = {
            verifierId: adminUser.id!,
            verifierName: adminUser.name,
            verifiedAt: Timestamp.now(),
            notes: "Verified through edit form."
        };
        updates.verifiers = arrayUnion(newVerifier) as any;
    }

    await updateLead(leadId, updates);
    
    // Log the detailed changes if any were made
    if (Object.keys(changes).length > 0) {
        await logActivity({
            userId: adminUser.id!,
            userName: adminUser.name,
            userEmail: adminUser.email,
            role: "Admin",
            activity: "Lead Updated",
            details: {
                leadId: lead.id!,
                leadName: lead.name,
                changes: changes
            }
        });
    }

    const updatedLead = await getLead(leadId);
    if (updatedLead) {
        await updatePublicLead(updatedLead);
    }

    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${leadId}`);
    revalidatePath(`/admin/leads/${leadId}/edit`);

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating lead:", error);
    // Return the clean error, not a wrapped one
    return {
      success: false,
      error: error,
    };
  }
}
