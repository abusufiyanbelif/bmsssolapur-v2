
"use server";

import { updateAppSettings, AppSettings, getAppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateDonationConfiguration(
  settings: AppSettings['donationConfiguration']
): Promise<FormState> {
  
  try {
    const currentSettings = await getAppSettings();
    const updates = {
      donationConfiguration: {
        ...currentSettings.donationConfiguration,
        ...settings,
      }
    };

    await updateAppSettings(updates);
    
    revalidatePath("/admin/donations/configuration");

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating donation configuration:", error);
    return {
      success: false,
      error: error,
    };
  }
}
