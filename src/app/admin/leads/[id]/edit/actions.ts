

"use server";

import { getLead, updateLead, Lead, LeadPurpose, LeadStatus, LeadVerificationStatus, DonationType } from "@/services/lead-service";
import { revalidatePath } from "next/cache";
import { Timestamp, arrayUnion } from "firebase/firestore";
import type { User, Verifier } from "@/services/types";
import { getUser } from "@/services/user-service";
import { logActivity } from "@/services/activity-log-service";


interface FormState {
    success: boolean;
    error?: string;
}

// Helper function to find differences between two objects for logging
const getChangedFields = (original: Lead, updates: Partial<Lead>) => {
    const changes: Record<string, { from: any; to: any }> = {};
    for (const key in updates) {
        const typedKey = key as keyof Lead;
        // Simple comparison; for deep objects, a more robust solution might be needed
        if (original[typedKey] !== updates[typedKey]) {
            // Special handling for array of objects like 'acceptableDonationTypes'
            if (Array.isArray(original[typedKey]) && Array.isArray(updates[typedKey])) {
                if (JSON.stringify(original[typedKey]) !== JSON.stringify(updates[typedKey])) {
                    changes[typedKey] = {
                        from: (original[typedKey] as any[]).join(', '),
                        to: (updates[typedKey] as any[]).join(', ')
                    };
                }
            } else if (original[typedKey] instanceof Date && updates[typedKey] instanceof Date) {
                 if (original[typedKey]?.getTime() !== updates[typedKey]?.getTime()) {
                      changes[typedKey] = {
                        from: original[typedKey]?.toISOString().split('T')[0],
                        to: updates[typedKey]?.toISOString().split('T')[0]
                    };
                 }
            }
            else if (original[typedKey] !== updates[typedKey]) {
                 changes[typedKey] = { from: original[typedKey], to: updates[typedKey] };
            }
        }
    }
    return changes;
}

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
    const dueDateRaw = rawFormData.dueDate as string | undefined;
    const dueDate = dueDateRaw ? new Date(dueDateRaw) : undefined;

    const updates: Partial<Lead> = {
        campaignId: campaignId,
        campaignName: campaignName,
        headline: rawFormData.headline as string | undefined,
        story: rawFormData.story as string | undefined,
        purpose: purpose,
        otherPurposeDetail: rawFormData.otherPurposeDetail as string | undefined,
        category: rawFormData.category as string | undefined,
        otherCategoryDetail: rawFormData.otherCategoryDetail as string | undefined,
        acceptableDonationTypes: formData.getAll("acceptableDonationTypes") as DonationType[],
        helpRequested: parseFloat(rawFormData.helpRequested as string),
        dueDate: dueDate,
        caseDetails: rawFormData.caseDetails as string | undefined,
        isLoan: rawFormData.isLoan === 'on',
        status: status,
        verifiedStatus: verifiedStatus,
    };
    
    const changes = getChangedFields(lead, updates);
    
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

