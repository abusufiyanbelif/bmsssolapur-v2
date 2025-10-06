
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
    const currentSettings = await getSettingsService();
    const updates: Partial<AppSettings> = JSON.parse(JSON.stringify(currentSettings));

    // This is a safer way to check for form data presence
    if (formData.has('login.password') || formData.has('login.otp') || formData.has('login.google')) {
        updates.loginMethods = {
            password: { enabled: formData.get('login.password') === 'on' },
            otp: { enabled: formData.get('login.otp') === 'on' },
            google: { enabled: formData.get('login.google') === 'on' },
        };
    }

    if (formData.has('feature.directPayment') || formData.has('feature.onlinePayments')) {
        updates.features = {
          directPaymentToBeneficiary: { enabled: formData.get('feature.directPayment') === 'on' },
          onlinePaymentsEnabled: formData.get('feature.onlinePayments') === 'on',
        }
    }
    
    if (formData.has('payment.bankTransfer') || formData.has('payment.cash') || formData.has('payment.upi') || formData.has('payment.other')) {
        updates.paymentMethods = {
            bankTransfer: { enabled: formData.get('payment.bankTransfer') === 'on' },
            cash: { enabled: formData.get('payment.cash') === 'on' },
            upi: { enabled: formData.get('payment.upi') === 'on' },
            other: { enabled: formData.get('payment.other') === 'on' },
        }
    }


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
