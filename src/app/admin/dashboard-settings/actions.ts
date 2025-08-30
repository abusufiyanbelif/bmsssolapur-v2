

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
  currentSettings: AppSettings['dashboard']
): Promise<FormState> {
  
  try {
    const newSettings: DashboardSettings = {
        mainMetrics: { visibleTo: [] },
        fundsInHand: { visibleTo: [] },
        monthlyContributors: { visibleTo: [] },
        monthlyPledge: { visibleTo: [] },
        pendingLeads: { visibleTo: [] },
        pendingDonations: { visibleTo: [] },
        leadsReadyToPublish: { visibleTo: [] },
        beneficiaryBreakdown: { visibleTo: [] },
        campaignBreakdown: { visibleTo: [] },
        leadBreakdown: { visibleTo: [] },
        donationsChart: { visibleTo: [] },
        topDonors: { visibleTo: [] },
        recentCampaigns: { visibleTo: [] },
        donationTypeBreakdown: { visibleTo: [] },
        donorContributionSummary: { visibleTo: [] },
        donorImpactSummary: { visibleTo: [] },
        beneficiarySummary: { visibleTo: [] },
        referralSummary: { visibleTo: [] },
    };

    // Process form data to populate the new settings object
    const formKeys = new Set(Object.keys(currentSettings || {}));
    
    formKeys.forEach(key => {
        const cardKey = key as keyof DashboardSettings;
        if (dashboardCardKeys.includes(cardKey)) {
             newSettings[cardKey] = { visibleTo: currentSettings?.[cardKey]?.visibleTo || [] };
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
