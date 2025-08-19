

"use server";

import { updateAppSettings, AppSettings, getAppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateGatewaySettings(
  formData: FormData
): Promise<FormState> {
  
  try {
    const currentSettings = await getAppSettings();
    
    const updates: Partial<AppSettings> = {
      paymentGateway: {
        razorpay: {
            enabled: formData.get("razorpay.enabled") === 'on',
            mode: formData.get("razorpay.mode") as 'test' | 'live',
            test: {
                keyId: formData.get("razorpay.test.keyId") as string,
                keySecret: formData.get("razorpay.test.keySecret") as string,
            },
            live: {
                keyId: formData.get("razorpay.live.keyId") as string,
                keySecret: formData.get("razorpay.live.keySecret") as string,
            },
        },
        phonepe: {
            enabled: formData.get("phonepe.enabled") === 'on',
            mode: formData.get("phonepe.mode") as 'test' | 'live',
            test: {
                merchantId: formData.get("phonepe.test.merchantId") as string,
                saltKey: formData.get("phonepe.test.saltKey") as string,
                saltIndex: Number(formData.get("phonepe.test.saltIndex") as string),
            },
            live: {
                 merchantId: formData.get("phonepe.live.merchantId") as string,
                saltKey: formData.get("phonepe.live.saltKey") as string,
                saltIndex: Number(formData.get("phonepe.live.saltIndex") as string),
            },
        },
      }
    };

    await updateAppSettings(updates);
    
    revalidatePath("/admin/payment-gateways");
    revalidatePath("/admin/settings");
    revalidatePath("/donate");

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
