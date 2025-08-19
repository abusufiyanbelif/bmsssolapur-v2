

"use server";

import { updateAppSettings, AppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";

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
        password: { enabled: formData.get("login.password") === 'on' },
        otp: { enabled: formData.get("login.otp") === 'on' },
        google: { enabled: formData.get("login.google") === 'on' },
      },
      services: {
        nodemailer: { enabled: formData.get("service.email") === 'on' },
        twilio: { enabled: formData.get("service.sms") === 'on' },
        whatsapp: { enabled: formData.get("service.whatsapp") === 'on' },
      },
      features: {
        directPaymentToBeneficiary: { enabled: formData.get("feature.directPayment") === 'on' },
      },
      paymentMethods: {
        bankTransfer: { enabled: formData.get("payment.bankTransfer") === 'on' },
        cash: { enabled: formData.get("payment.cash") === 'on' },
        upi: { enabled: formData.get("payment.upi") === 'on' },
        other: { enabled: formData.get("payment.other") === 'on' },
      },
    };

    await updateAppSettings(updates);
    
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
