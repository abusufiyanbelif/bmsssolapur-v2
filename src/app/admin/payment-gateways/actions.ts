
'use server';

import { updateAppSettings, AppSettings, getAppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";
import { testRazorpayConnection } from "@/services/razorpay-service";

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
                },
                live: {
                    keyId: formData.get(`${gatewayName}.live.keyId`) as string,
                    keySecret: formData.get(`${gatewayName}.live.keySecret`) as string,
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

export async function handleTestGatewayConnection(gatewayName: 'razorpay'): Promise<{success: boolean, error?: string}> {
    try {
        if (gatewayName === 'razorpay') {
            await testRazorpayConnection();
            return { success: true };
        }
        // Add other gateway tests here
        return { success: false, error: 'Unknown gateway for testing.' };
    } catch (e) {
        const error = e instanceof Error ? e.message : `An unknown error occurred while testing ${gatewayName}.`;
        console.error(`Error testing ${gatewayName} connection:`, error);
        return { success: false, error: error };
    }
}
