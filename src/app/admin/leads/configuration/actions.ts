

"use server";

import { updateAppSettings, AppSettings, getAppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";
import { updateUser, getAllUsers } from "@/services/user-service";
import { arrayRemove, arrayUnion, writeBatch, doc } from "firebase/firestore";
import { db } from "@/services/firebase";
import type { UserRole, LeadPurpose } from "@/services/types";
import { getAllLeads, updateLead } from "@/services/lead-service";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateLeadConfiguration(
  settings: AppSettings['leadConfiguration']
): Promise<FormState> {
  
  try {
    const updates = {
      leadConfiguration: settings
    };

    await updateAppSettings(updates);
    
    revalidatePath("/admin/leads/configuration", 'layout');

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

export async function handleAddLeadPurpose(name: string): Promise<FormState> {
  if (!name) return { success: false, error: "Purpose name cannot be empty." };
  
  try {
    const settings = await getAppSettings();
    const currentPurposes = settings.leadConfiguration?.purposes || [];

    if (currentPurposes.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        return { success: false, error: "A purpose with this name already exists." };
    }

    const newPurpose = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name: name,
        enabled: true,
    };

    const updatedPurposes = [...currentPurposes, newPurpose];
    await updateAppSettings({ leadConfiguration: { ...settings.leadConfiguration, purposes: updatedPurposes } });
    
    revalidatePath("/admin/leads/configuration", 'layout');
    return { success: true };
  } catch(e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    return { success: false, error: error };
  }
}


export async function handleUpdateLeadPurpose(oldName: string, newName: string): Promise<FormState> {
    if (!newName) return { success: false, error: "New purpose name cannot be empty." };

    try {
        const settings = await getAppSettings();
        const currentPurposes = settings.leadConfiguration?.purposes || [];
        const purposeIndex = currentPurposes.findIndex(p => p.name === oldName);

        if (purposeIndex === -1) {
            return { success: false, error: "Original purpose not found." };
        }
        if (currentPurposes.some(p => p.name.toLowerCase() === newName.toLowerCase() && p.name !== oldName)) {
            return { success: false, error: "A purpose with the new name already exists." };
        }

        const updatedPurposes = [...currentPurposes];
        updatedPurposes[purposeIndex].name = newName;
        
        const leads = await getAllLeads();
        const affectedLeads = leads.filter(lead => lead.purpose === oldName);

        const batch = writeBatch(db);
        affectedLeads.forEach(lead => {
            const leadRef = doc(db, 'leads', lead.id!);
            batch.update(leadRef, { purpose: newName });
        });

        await batch.commit();
        await updateAppSettings({ leadConfiguration: { ...settings.leadConfiguration, purposes: updatedPurposes } });
        
        revalidatePath("/admin/leads/configuration", 'layout');
        revalidatePath("/admin/leads");
        
        return { success: true };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        return { success: false, error };
    }
}


export async function handleDeleteLeadPurpose(purposeToDelete: string, newPurposeForLeads: string): Promise<FormState> {
    if (!purposeToDelete || !newPurposeForLeads) {
        return { success: false, error: "Both the purpose to delete and the new purpose for leads are required." };
    }

    try {
        const settings = await getAppSettings();
        let currentPurposes = settings.leadConfiguration?.purposes || [];
        
        const updatedPurposes = currentPurposes.filter(p => p.name !== purposeToDelete);
        
        const leads = await getAllLeads();
        const affectedLeads = leads.filter(lead => lead.purpose === purposeToDelete);
        
        const batch = writeBatch(db);
        affectedLeads.forEach(lead => {
            const leadRef = doc(db, 'leads', lead.id!);
            batch.update(leadRef, { purpose: newPurposeForLeads });
        });
        
        await batch.commit();
        await updateAppSettings({ leadConfiguration: { ...settings.leadConfiguration, purposes: updatedPurposes } });
        
        revalidatePath("/admin/leads/configuration", 'layout');
        revalidatePath("/admin/leads");
        
        return { success: true };
    } catch(e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        return { success: false, error };
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
