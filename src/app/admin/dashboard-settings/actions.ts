

"use server";

import { updateAppSettings, AppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";
import type { DashboardSettings, UserRole } from "@/services/types";

interface FormState {
    success: boolean;
    error?: string;
}

const dashboardCardKeys: (keyof DashboardSettings)[] = [
    'mainMetrics', 'fundsInHand', 'monthlyContributors', 'monthlyPledge',
    'pendingLeads', 'pendingDonations', 'leadsReadyToPublish', 'beneficiaryBreakdown',
    'campaignBreakdown', 'leadBreakdown', 'donationsChart', 'topDonors',
    'recentCampaigns', 'donationTypeBreakdown', 'donorContributionSummary',
    'donorImpactSummary', 'beneficiarySummary', 'referralSummary'
];

export async function handleUpdateDashboardSettings(
  formData: FormData
): Promise<FormState> {
  
  try {
    const newSettings: Partial<DashboardSettings> = {};

    dashboardCardKeys.forEach(key => {
        const visibleToRoles = formData.getAll(`${key}-roles`) as UserRole[];
        newSettings[key] = { visibleTo: visibleToRoles };
    });

    await updateAppSettings({ dashboard: newSettings as DashboardSettings });
    
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
