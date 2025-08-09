
"use server";

import { updateAppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";

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
