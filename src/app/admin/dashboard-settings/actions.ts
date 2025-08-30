

"use server";

import { updateAppSettings, AppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";
import type { DashboardSettings } from "@/services/types";

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
  currentSettings: AppSettings['dashboard'],
  formData: FormData
): Promise<FormState> {
  
  try {
    // Properly initialize newSettings to conform to DashboardSettings type
    const newSettings: DashboardSettings = {} as DashboardSettings;
    for (const key of dashboardCardKeys) {
        newSettings[key] = { visibleTo: [] };
    }

    // Process form data to populate the new settings object
    const formKeys = Array.from(formData.keys()).map(k => k.split('-')[0]);
    const allKeys = new Set([...dashboardCardKeys, ...formKeys]);
    
    allKeys.forEach(key => {
        const cardKey = key as keyof DashboardSettings;
        if (dashboardCardKeys.includes(cardKey)) {
            const visibleTo = formData.getAll(`${cardKey}-roles`);
            newSettings[cardKey] = { visibleTo: (visibleTo as any[]) || [] };
        }
    });
    
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

