

"use server";

import { updateAppSettings, AppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";
import { AnalyticsDashboardSettings, UserRole } from "@/services/types";

interface FormState {
    success: boolean;
    error?: string;
}

const analyticsDashboardCardKeys: (keyof AnalyticsDashboardSettings)[] = [
    'financialPerformance', 'systemHealth', 'dataGrowthChart', 'donationsChart', 'usersChart', 'leadBreakdown', 'campaignBreakdown'
];

export async function handleUpdateAnalyticsDashboardSettings(
  formData: FormData
): Promise<FormState> {
  
  try {
    const newSettings: Partial<AnalyticsDashboardSettings> = {};

    analyticsDashboardCardKeys.forEach(key => {
        const visibleToRoles = formData.getAll(`${key}-roles`) as UserRole[];
        newSettings[key] = { visibleTo: visibleToRoles };
    });
    
    await updateAppSettings({ analyticsDashboard: newSettings as AnalyticsDashboardSettings });
    
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
