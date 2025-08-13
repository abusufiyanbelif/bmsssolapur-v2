
"use server";

import { updateAppSettings, AppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";
import type { LeadStatus } from "@/services/types";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateLeadWorkflow(
  workflow: Record<LeadStatus, LeadStatus[]>
): Promise<FormState> {
  
  try {
    const updates = {
      leadConfiguration: {
        workflow,
      }
    };

    await updateAppSettings(updates);
    
    revalidatePath("/admin/leads/configuration/workflow");
    // Eventually, we would need to revalidate any page where status can be changed
    // to ensure the new rules are applied.

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating lead workflow:", error);
    return {
      success: false,
      error: error,
    };
  }
}
