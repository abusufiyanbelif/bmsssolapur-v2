
"use server";

import { updateAppSettings, AppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";
import { testTwilioConnection, testNodemailerConnection } from "@/app/services/actions";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateNotificationSettings(
  newSettings: AppSettings['notificationSettings']
): Promise<FormState> {
  
  try {
    const updates = {
      notificationSettings: newSettings,
    };

    await updateAppSettings(updates);
    
    revalidatePath("/admin/settings/notifications");

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating notification settings:", error);
    return {
      success: false,
      error: error,
    };
  }
}

export async function testProviderConnection(provider: 'twilio' | 'nodemailer' | 'firebase'): Promise<{success: boolean, error?: string}> {
  try {
    if (provider === 'twilio') {
        return await testTwilioConnection();
    }
    if (provider === 'nodemailer') {
        return await testNodemailerConnection();
    }
    if (provider === 'firebase') {
      // Firebase connection is implicitly tested by server startup.
      // We can add a more specific test if needed, e.g., fetching a remote config flag.
      return { success: true };
    }
    return { success: false, error: 'Unknown provider.' };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred';
    return { success: false, error: error };
  }
}
