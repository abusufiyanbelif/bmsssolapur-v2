
'use server';

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
    
    // Determine which gateway is being updated based on a hidden input
    const gatewayName = formData.get("gatewayName") as keyof AppSettings['paymentGateway'];

    let updates: Partial<AppSettings> = {};

    if (gatewayName) {
        // Update a specific gateway
        updates.paymentGateway = {
            ...currentSettings.paymentGateway,
            [gatewayName]: {
                enabled: formData.get(`${gatewayName}.enabled`) === 'on',
                mode: formData.get(`${gatewayName}.mode`) as 'test' | 'live',
                test: {
                    keyId: formData.get(`${gatewayName}.test.keyId`) as string,
                    keySecret: formData.get(`${gatewayName}.test.keySecret`) as string,
                    merchantId: formData.get(`${gatewayName}.test.merchantId`) as string,
                    merchantKey: formData.get(`${gatewayName}.test.merchantKey`) as string,
                    saltKey: formData.get(`${gatewayName}.test.saltKey`) as string,
                    saltIndex: Number(formData.get(`${gatewayName}.test.saltIndex`) as string) || undefined,
                    appId: formData.get(`${gatewayName}.test.appId`) as string,
                    secretKey: formData.get(`${gatewayName}.test.secretKey`) as string,
                    apiKey: formData.get(`${gatewayName}.test.apiKey`) as string,
                    authToken: formData.get(`${gatewayName}.test.authToken`) as string,
                    publishableKey: formData.get(`${gatewayName}.test.publishableKey`) as string,
                },
                live: {
                    keyId: formData.get(`${gatewayName}.live.keyId`) as string,
                    keySecret: formData.get(`${gatewayName}.live.keySecret`) as string,
                    merchantId: formData.get(`${gatewayName}.live.merchantId`) as string,
                    merchantKey: formData.get(`${gatewayName}.live.merchantKey`) as string,
                    saltKey: formData.get(`${gatewayName}.live.saltKey`) as string,
                    saltIndex: Number(formData.get(`${gatewayName}.live.saltIndex`) as string) || undefined,
                    appId: formData.get(`${gatewayName}.live.appId`) as string,
                    secretKey: formData.get(`${gatewayName}.live.secretKey`) as string,
                    apiKey: formData.get(`${gatewayName}.live.apiKey`) as string,
                    authToken: formData.get(`${gatewayName}.live.authToken`) as string,
                    publishableKey: formData.get(`${gatewayName}.live.publishableKey`) as string,
                },
            }
        };
    } else if (formData.has('onlinePaymentsEnabled')) {
        // Update the master feature flag
        updates.features = {
          ...(currentSettings.features || {}),
          onlinePaymentsEnabled: formData.get("onlinePaymentsEnabled") === 'on',
        }
    }


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
