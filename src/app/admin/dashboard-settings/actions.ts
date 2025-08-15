

"use server";

import { updateAppSettings, AppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateDashboardSettings(
  currentSettings: AppSettings['dashboard'],
  formData: FormData
): Promise<FormState> {
  
  try {
    const newSettings = { ...currentSettings };
    
    for (const key in newSettings) {
        const cardKey = key as keyof typeof newSettings;
        const visibleTo = formData.getAll(`${cardKey}-roles`);
        if (newSettings[cardKey]) {
            newSettings[cardKey]!.visibleTo = visibleTo as any;
        } else {
             // Handle new keys that might not be in currentSettings yet
            (newSettings as any)[cardKey] = { visibleTo: visibleTo as any };
        }
    }
    
    await updateAppSettings({ dashboard: newSettings });
    
    revalidatePath("/admin/dashboard-settings");
    revalidatePath("/admin");

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating dashboard settings:", error);
    return {
      success: false,
      error: error,
    };
  }
}
