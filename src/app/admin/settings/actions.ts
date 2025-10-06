
"use server";

import { updateAppSettings as updateSettingsService, AppSettings, getAppSettings as getSettingsService } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";
import { getCurrentOrganization as getOrgService } from "@/services/organization-service";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateAppSettings(
  formData: FormData
): Promise<FormState> {
  
  try {
    const updates: Partial<AppSettings> = {
      loginMethods: {
        password: { enabled: formData.has("login.password") },
        otp: { enabled: formData.has("login.otp") },
        google: { enabled: formData.has("login.google") },
      },
      features: {
        directPaymentToBeneficiary: { enabled: formData.has("feature.directPayment") },
        onlinePaymentsEnabled: formData.has("feature.onlinePayments"),
      },
      paymentMethods: {
        bankTransfer: { enabled: formData.has("payment.bankTransfer") },
        cash: { enabled: formData.has("payment.cash") },
        upi: { enabled: formData.has("payment.upi") },
        other: { enabled: formData.has("payment.other") },
      },
    };

    await updateSettingsService(updates);
    
    revalidatePath("/admin/settings");

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating app settings:", error);
    return {
      success: false,
      error: error,
    };
  }
}

export async function getCurrentOrganization() {
    return getOrgService();
}

export async function getAppSettings() {
    return getSettingsService();
}
