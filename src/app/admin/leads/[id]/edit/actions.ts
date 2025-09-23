
"use server";

import { getLead, updateLead, Lead, LeadPurpose, LeadStatus, LeadVerificationStatus, DonationType, LeadAction } from "@/services/lead-service";
import { revalidatePath } from "next/cache";
import { Timestamp, arrayUnion } from "firebase/firestore";
import type { User, Verifier } from "@/services/types";
import { getUser } from "@/services/user-service";
import { logActivity } from "@/services/activity-log-service";
import { updatePublicLead } from "@/services/public-data-service";
import { getCampaign } from "@/services/campaign-service";
import { EditLeadFormValues } from "./edit-lead-form";


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
        else if (String(originalValue) !== String(updatedValue)) {
             changes[typedKey] = {
                from: originalValue || "N/A",
                to: updatedValue,
            };
        }
    }
    return changes;
};

export async function handleUpdateLead(
  leadId: string,
  values: EditLeadFormValues,
  adminUserId: string,
): Promise<FormState> {
  try {
    const lead = await getLead(leadId);
    if (!lead) {
        return { success: false, error: "Lead not found." };
    }
    
    const adminUser = await getUser(adminUserId);
    if (!adminUser) {
        return { success: false, error: "Admin user not found." };
    }

    let campaignName: string | undefined;
    if (values.campaignId && values.campaignId !== 'none') {
        const campaign = await getCampaign(values.campaignId);
        campaignName = campaign?.name;
    }

    const updates: Partial<Lead> = {
        name: values.name,
        beneficiaryId: values.beneficiaryId || undefined,
        referredByUserId: values.referredByUserId || undefined,
        campaignId: values.campaignId === 'none' ? undefined : values.campaignId,
        campaignName: values.campaignId === 'none' ? undefined : campaignName,
        headline: values.headline,
        story: values.story,
        purpose: values.purpose,
        otherPurposeDetail: values.otherPurposeDetail,
        category: values.category,
        otherCategoryDetail: values.otherCategoryDetail,
        acceptableDonationTypes: values.acceptableDonationTypes,
        helpRequested: values.helpRequested,
        fundingGoal: values.fundingGoal,
        dueDate: values.dueDate,
        verificationDueDate: values.verificationDueDate,
        caseDetails: values.caseDetails,
        isLoan: values.isLoan,
        status: values.status,
        caseAction: values.caseAction,
        verifiedStatus: values.verifiedStatus,
        degree: values.degree,
        year: values.year,
        semester: values.semester,
        priority: values.priority,
        diseaseIdentified: values.diseaseIdentified,
        diseaseStage: values.diseaseStage,
        diseaseSeriousness: values.diseaseSeriousness,
    };
    
    // If a beneficiary is being linked for the first time, update the lead name
    if (values.beneficiaryId && !lead.beneficiaryId) {
        const newBeneficiary = await getUser(values.beneficiaryId);
        if (newBeneficiary) {
            updates.name = newBeneficiary.name;
        }
    }
    
    const changes = getChangedFields(lead, updates);
    
    if (values.caseAction === 'Closed' && lead.caseAction !== 'Closed') {
        updates.closedAt = new Date();
    }
    
    if (values.verifiedStatus === 'Verified' && lead.verifiedStatus !== 'Verified') {
        const newVerifier: Verifier = {
            verifierId: adminUser.id!,
            verifierName: adminUser.name,
            verifiedAt: Timestamp.now() as any,
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
