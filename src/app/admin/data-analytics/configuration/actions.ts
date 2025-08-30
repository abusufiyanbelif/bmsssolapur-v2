

"use server";

import { updateAppSettings, AppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";
import { AnalyticsDashboardSettings } from "@/services/types";

interface FormState {
    success: boolean;
    error?: string;
}

const analyticsDashboardCardKeys: (keyof AnalyticsDashboardSettings)[] = [
    'financialPerformance',
];

export async function handleUpdateAnalyticsDashboardSettings(
  currentSettings: AppSettings['analyticsDashboard'],
  formData: FormData
): Promise<FormState> {
  
  try {
    const newSettings: AnalyticsDashboardSettings = {
        financialPerformance: { visibleTo: [] }
    };

    analyticsDashboardCardKeys.forEach(key => {
        const visibleTo = formData.getAll(`${key}-roles`);
        if (newSettings[key]) {
            newSettings[key] = { visibleTo: (visibleTo as any[]) || [] };
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
