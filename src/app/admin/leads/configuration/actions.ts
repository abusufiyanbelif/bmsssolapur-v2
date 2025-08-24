

"use server";

import { updateAppSettings, AppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";
import { updateUser } from "@/services/user-service";
import { arrayRemove, arrayUnion, writeBatch, doc } from "firebase/firestore";
import { db } from "@/services/firebase";
import type { UserRole } from "@/services/types";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateLeadConfiguration(
  disabledPurposes: string[],
  approvalProcessDisabled: boolean,
  roleBasedCreationEnabled: boolean,
  leadCreatorRoles: UserRole[]
): Promise<FormState> {
  
  try {
    const updates = {
      leadConfiguration: {
        disabledPurposes,
        approvalProcessDisabled,
        roleBasedCreationEnabled,
        leadCreatorRoles,
      }
    };

    await updateAppSettings(updates);
    
    revalidatePath("/admin/leads/configuration");
    revalidatePath("/admin/leads/add"); // Revalidate to ensure form gets new settings

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating lead configuration:", error);
    return {
      success: false,
      error: error,
    };
  }
}

export async function handleAddApprover(userIds: string[], group: string): Promise<FormState> {
  try {
    const batch = writeBatch(db);
    userIds.forEach(userId => {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, { groups: arrayUnion(group) });
    });
    await batch.commit();

    revalidatePath("/admin/leads/configuration");
    return { success: true };
  } catch(e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    return { success: false, error: error };
  }
}

export async function handleRemoveApprover(userId: string, group: string): Promise<FormState> {
  try {
    await updateUser(userId, { groups: arrayRemove(group) as any });
    revalidatePath("/admin/leads/configuration");
    return { success: true };
  } catch(e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    return { success: false, error: error };
  }
}

export async function handleMakeMandatory(userId: string): Promise<FormState> {
  try {
    // Atomically remove from optional and add to mandatory
    await updateUser(userId, { 
      groups: arrayUnion('Mandatory Lead Approver', 'Lead Approver') as any 
    });
    revalidatePath("/admin/leads/configuration");
    return { success: true };
  } catch(e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    return { success: false, error: error };
  }
}


export async function handleMakeOptional(userId: string): Promise<FormState> {
  try {
    // Atomically remove from mandatory
    await updateUser(userId, { 
      groups: arrayRemove('Mandatory Lead Approver') as any
    });
    revalidatePath("/admin/leads/configuration");
    return { success: true };
  } catch(e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    return { success: false, error: error };
  }
}

export async function handleSkipVerification(leadId: string, adminUserId: string, reason: string): Promise<{success: boolean, error?: string}> {
    try {
        const { getLead, updateLead } = await import('@/services/lead-service');
        const { getUser } = await import('@/services/user-service');
        const { logActivity } = await import('@/services/activity-log-service');
        
        const [lead, adminUser] = await Promise.all([
            getLead(leadId),
            getUser(adminUserId)
        ]);

        if (!lead) return { success: false, error: "Lead not found." };
        if (!adminUser) return { success: false, error: "Admin user not found." };

        const updates = {
            caseVerification: 'Verified' as const,
            caseAction: 'Ready For Help' as const,
            verifiers: arrayUnion({
                verifierId: adminUserId,
                verifierName: adminUser.name,
                verifiedAt: new Date(),
                notes: `Verification skipped by admin. Reason: ${reason}`
            })
        };

        await updateLead(leadId, updates);
        
        await logActivity({
            userId: adminUserId,
            userName: adminUser.name,
            userEmail: adminUser.email,
            role: "Admin",
            activity: "Lead Verification Skipped",
            details: { leadId, leadName: lead.name, reason }
        });
        
        revalidatePath(`/admin/leads/${leadId}`);
        revalidatePath('/admin/leads');

        return { success: true };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        console.error("Error skipping verification:", error);
        return { success: false, error: `Failed to skip verification: ${error}` };
    }
}
