

"use server";

import { updateAppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";
import { updateUser } from "@/services/user-service";
import { arrayRemove, arrayUnion } from "firebase/firestore";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateLeadConfiguration(
  disabledPurposes: string[]
): Promise<FormState> {
  
  try {
    const updates = {
      leadConfiguration: {
        disabledPurposes,
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

export async function handleAddApprover(userId: string, group: string): Promise<FormState> {
  try {
    await updateUser(userId, { groups: arrayUnion(group) as any });
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
