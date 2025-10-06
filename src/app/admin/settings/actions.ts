

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

    if (formData.has('login.password')) updates.loginMethods!.password.enabled = formData.get('login.password') === 'on';
    if (formData.has('login.otp')) updates.loginMethods!.otp.enabled = formData.get('login.otp') === 'on';
    if (formData.has('login.google')) updates.loginMethods!.google.enabled = formData.get('login.google') === 'on';

    if (formData.has('feature.directPayment')) updates.features!.directPaymentToBeneficiary.enabled = formData.get('feature.directPayment') === 'on';
    if (formData.has('feature.onlinePayments')) updates.features!.onlinePaymentsEnabled = formData.get('feature.onlinePayments') === 'on';
    
    if (formData.has('payment.bankTransfer')) updates.paymentMethods!.bankTransfer.enabled = formData.get('payment.bankTransfer') === 'on';
    if (formData.has('payment.cash')) updates.paymentMethods!.cash.enabled = formData.get('payment.cash') === 'on';
    if (formData.has('payment.upi')) updates.paymentMethods!.upi.enabled = formData.get('payment.upi') === 'on';
    if (formData.has('payment.other')) updates.paymentMethods!.other.enabled = formData.get('payment.other') === 'on';


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
