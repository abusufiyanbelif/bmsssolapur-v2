

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
    
    // Start with a deep copy of the existing settings to avoid overwriting nested objects
    const newSettings = JSON.parse(JSON.stringify(currentSettings));

    // --- Update SMS Provider Choice ---
    if (formData.has("sms.provider")) {
        const smsProvider = formData.get("sms.provider") as 'twilio' | 'firebase';
        if (!newSettings.notificationSettings.sms) {
            newSettings.notificationSettings.sms = {};
        }
        newSettings.notificationSettings.sms.provider = smsProvider;
    }

    // --- Update Twilio SMS/OTP settings ---
    if (formData.has("sms.twilio.accountSid")) {
      newSettings.notificationSettings.sms.twilio = {
          accountSid: formData.get("sms.twilio.accountSid") as string,
          authToken: formData.get("sms.twilio.authToken") as string,
          verifySid: formData.get("sms.twilio.verifySid") as string,
          fromNumber: formData.get("sms.twilio.fromNumber") as string,
      };
    }
    
    // --- Update Twilio WhatsApp settings ---
    if (formData.has("whatsapp.twilio.fromNumber")) {
        if(!newSettings.notificationSettings.whatsapp) {
            newSettings.notificationSettings.whatsapp = { provider: 'twilio', twilio: {} };
        }
        newSettings.notificationSettings.whatsapp.twilio = {
            accountSid: formData.get("whatsapp.twilio.accountSid") as string,
            authToken: formData.get("whatsapp.twilio.authToken") as string,
            fromNumber: formData.get("whatsapp.twilio.fromNumber") as string,
        };
    }
    
    // --- Update Nodemailer settings ---
    if (formData.has("email.nodemailer.host")) {
        if(!newSettings.notificationSettings.email) {
            newSettings.notificationSettings.email = { provider: 'nodemailer', nodemailer: {} };
        }
        newSettings.notificationSettings.email.nodemailer = {
            host: formData.get("email.nodemailer.host") as string,
            port: Number(formData.get("email.nodemailer.port")),
            secure: formData.get("email.nodemailer.secure") === 'on',
            user: formData.get("email.nodemailer.user") as string,
            pass: formData.get("email.nodemailer.pass") as string,
            from: formData.get("email.nodemailer.from") as string,
        };
    }
    
    await updateAppSettings({ notificationSettings: newSettings.notificationSettings });
    
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
