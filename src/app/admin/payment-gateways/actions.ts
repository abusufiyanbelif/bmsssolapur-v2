
"use server";

import { updateAppSettings, AppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateGatewaySettings(
  formData: FormData
): Promise<FormState> {
  
  try {
    const updates: Partial<AppSettings> = {
      paymentGateway: {
        razorpay: {
            enabled: formData.get("gateway.razorpay.enabled") === 'on',
            keyId: formData.get("gateway.razorpay.keyId") as string,
            keySecret: formData.get("gateway.razorpay.keySecret") as string,
        },
        phonepe: {
            enabled: formData.get("gateway.phonepe.enabled") === 'on',
            merchantId: formData.get("gateway.phonepe.merchantId") as string,
            saltKey: formData.get("gateway.phonepe.saltKey") as string,
            saltIndex: Number(formData.get("gateway.phonepe.saltIndex") as string),
        },
      }
    };

    await updateAppSettings(updates);
    
    revalidatePath("/admin/payment-gateways");
    revalidatePath("/admin/settings"); // In case some settings from here are used elsewhere

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating payment gateway settings:", error);
    return {
      success: false,
      error: error,
    };
  }
}
