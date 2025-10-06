

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
    
    const gatewayName = formData.get("gatewayName") as keyof AppSettings['paymentGateway'] | null;

    let updates: Partial<AppSettings> = {};

    if (gatewayName) {
        updates.paymentGateway = {
            ...currentSettings.paymentGateway,
            [gatewayName]: {
                enabled: formData.get(`${gatewayName}.enabled`) === 'on',
                mode: formData.get(`${gatewayName}.mode`) as 'test' | 'live',
                test: {
                    keyId: formData.get(`${gatewayName}.test.keyId`) as string,
                    keySecret: formData.get(`${gatewayName}.test.keySecret`) as string,
                },
                live: {
                    keyId: formData.get(`${gatewayName}.live.keyId`) as string,
                    keySecret: formData.get(`${gatewayName}.live.keySecret`) as string,
                },
            }
        };
    } else if (formData.has('onlinePaymentsEnabled')) {
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
