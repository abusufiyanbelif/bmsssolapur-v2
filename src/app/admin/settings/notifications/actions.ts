
"use server";

import { updateAppSettings, AppSettings, getAppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";
import { testTwilioConnection, testNodemailerConnection } from "@/app/services/actions";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateNotificationSettings(
  formData: FormData
): Promise<FormState> {
  
  try {
    const currentSettings = await getAppSettings();
    const newSettings = JSON.parse(JSON.stringify(currentSettings.notificationSettings || {}));

    // Determine which form was submitted based on a unique field
    if (formData.has("sms.provider")) {
        newSettings.sms = {
            ...newSettings.sms,
            provider: formData.get("sms.provider") as 'twilio' | 'firebase'
        };
    }

    if (formData.has("sms.twilio.accountSid") || formData.has("sms.twilio.enabled")) {
      newSettings.sms.twilio = {
          ...newSettings.sms.twilio,
          enabled: formData.get("sms.twilio.enabled") === 'on',
          accountSid: formData.get("sms.twilio.accountSid") as string,
          authToken: formData.get("sms.twilio.authToken") as string,
          verifySid: formData.get("sms.twilio.verifySid") as string,
          fromNumber: formData.get("sms.twilio.fromNumber") as string,
      };
      // Also update whatsapp settings if they share credentials
      newSettings.whatsapp.twilio = {
        ...newSettings.whatsapp.twilio,
        accountSid: formData.get("sms.twilio.accountSid") as string,
        authToken: formData.get("sms.twilio.authToken") as string,
      };
    }
    
    if (formData.has("whatsapp.twilio.fromNumber") || formData.has("whatsapp.twilio.enabled")) {
        if(!newSettings.whatsapp) {
            newSettings.whatsapp = { provider: 'twilio', twilio: {} };
        }
        newSettings.whatsapp.twilio = {
            ...newSettings.whatsapp.twilio,
            enabled: formData.get("whatsapp.twilio.enabled") === 'on',
            fromNumber: formData.get("whatsapp.twilio.fromNumber") as string,
        };
    }
    
    if (formData.has("email.nodemailer.host") || formData.has("email.nodemailer.enabled")) {
        if(!newSettings.email) {
            newSettings.email = { provider: 'nodemailer', nodemailer: {} };
        }
        newSettings.email.nodemailer = {
            ...newSettings.email.nodemailer,
            enabled: formData.get("email.nodemailer.enabled") === 'on',
            host: formData.get("email.nodemailer.host") as string,
            port: Number(formData.get("email.nodemailer.port")),
            secure: formData.get("email.nodemailer.secure") === 'on',
            user: formData.get("email.nodemailer.user") as string,
            pass: formData.get("email.nodemailer.pass") as string,
            from: formData.get("email.nodemailer.from") as string,
        };
    }
    
    await updateAppSettings({ notificationSettings: newSettings });
    
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
