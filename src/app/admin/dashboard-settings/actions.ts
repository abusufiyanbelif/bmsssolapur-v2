

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
    const newSettings: AppSettings['dashboard'] = { ...currentSettings };
    
    const keys = new Set([...Object.keys(newSettings || {}), ...Array.from(formData.keys()).map(k => k.split('-')[0])]);
    
    keys.forEach(key => {
        const cardKey = key as keyof typeof newSettings;
        const visibleTo = formData.getAll(`${cardKey}-roles`);
        
        // Ensure the property exists before assigning to it
        if (!newSettings[cardKey]) {
            (newSettings as any)[cardKey] = {};
        }
        
        newSettings[cardKey]!.visibleTo = (visibleTo as any) || [];
    });
    
    await updateAppSettings({ dashboard: newSettings as AppSettings['dashboard'] });
    
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
