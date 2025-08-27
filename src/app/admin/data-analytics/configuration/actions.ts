

"use server";

import { updateAppSettings, AppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateAnalyticsDashboardSettings(
  currentSettings: AppSettings['analyticsDashboard'],
  formData: FormData
): Promise<FormState> {
  
  try {
    const newSettings: AppSettings['analyticsDashboard'] = { ...currentSettings };
    
    // This assumes all keys for the analytics dashboard are present in the form.
    const keys = new Set([...Object.keys(newSettings || {}), ...Array.from(formData.keys()).map(k => k.split('-')[0])]);
    
    keys.forEach(key => {
        const cardKey = key as keyof typeof newSettings;
        const visibleTo = formData.getAll(`${cardKey}-roles`);
        
        if (newSettings) {
            newSettings[cardKey] = { visibleTo: visibleTo as any };
        }
    });
    
    await updateAppSettings({ analyticsDashboard: newSettings });
    
    revalidatePath("/admin/data-analytics/configuration");
    revalidatePath("/admin/data-analytics");

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating analytics dashboard settings:", error);
    return {
      success: false,
      error: error,
    };
  }
}
