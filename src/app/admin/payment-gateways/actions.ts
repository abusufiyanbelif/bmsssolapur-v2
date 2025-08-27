

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
      features: {
          ...(currentSettings.features || {}),
          onlinePaymentsEnabled: formData.get("onlinePaymentsEnabled") === 'on',
      },
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
        paytm: {
            enabled: formData.get("paytm.enabled") === 'on',
            mode: formData.get("paytm.mode") as 'test' | 'live',
            test: {
                merchantId: formData.get("paytm.test.merchantId") as string,
                merchantKey: formData.get("paytm.test.merchantKey") as string,
            },
            live: {
                merchantId: formData.get("paytm.live.merchantId") as string,
                merchantKey: formData.get("paytm.live.merchantKey") as string,
            },
        },
        cashfree: {
            enabled: formData.get("cashfree.enabled") === 'on',
            mode: formData.get("cashfree.mode") as 'test' | 'live',
            test: {
                appId: formData.get("cashfree.test.appId") as string,
                secretKey: formData.get("cashfree.test.secretKey") as string,
            },
            live: {
                appId: formData.get("cashfree.live.appId") as string,
                secretKey: formData.get("cashfree.live.secretKey") as string,
            },
        },
        instamojo: {
            enabled: formData.get("instamojo.enabled") === 'on',
            mode: formData.get("instamojo.mode") as 'test' | 'live',
            test: {
                apiKey: formData.get("instamojo.test.apiKey") as string,
                authToken: formData.get("instamojo.test.authToken") as string,
            },
            live: {
                apiKey: formData.get("instamojo.live.apiKey") as string,
                authToken: formData.get("instamojo.live.authToken") as string,
            },
        },
        stripe: {
            enabled: formData.get("stripe.enabled") === 'on',
            mode: formData.get("stripe.mode") as 'test' | 'live',
            test: {
                publishableKey: formData.get("stripe.test.publishableKey") as string,
                secretKey: formData.get("stripe.test.secretKey") as string,
            },
            live: {
                publishableKey: formData.get("stripe.live.publishableKey") as string,
                secretKey: formData.get("stripe.live.secretKey") as string,
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
