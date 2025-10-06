

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
    const newNotificationSettings = JSON.parse(JSON.stringify(currentSettings.notificationSettings || {}));

    // --- Update SMS Provider Choice ---
    if (formData.has("sms.provider")) {
        const smsProvider = formData.get("sms.provider") as 'twilio' | 'firebase';
        // Ensure the sms object exists before trying to assign to its property
        if (!newNotificationSettings.sms) {
            newNotificationSettings.sms = {};
        }
        newNotificationSettings.sms.provider = smsProvider;
    }

    // --- Update Twilio SMS/OTP settings ---
    // Check for a field unique to this form to determine if it was submitted
    if (formData.has("sms.twilio.accountSid")) {
      newNotificationSettings.sms.twilio = {
          accountSid: formData.get("sms.twilio.accountSid") as string || newNotificationSettings.sms?.twilio?.accountSid || '',
          authToken: formData.get("sms.twilio.authToken") as string || newNotificationSettings.sms?.twilio?.authToken || '',
          verifySid: formData.get("sms.twilio.verifySid") as string || newNotificationSettings.sms?.twilio?.verifySid || '',
          fromNumber: formData.get("sms.twilio.fromNumber") as string || newNotificationSettings.sms?.twilio?.fromNumber || '',
      };
    }
    
    // --- Update Twilio WhatsApp settings ---
    if (formData.has("whatsapp.twilio.fromNumber")) {
        newNotificationSettings.whatsapp = {
            provider: 'twilio',
            twilio: {
                accountSid: formData.get("whatsapp.twilio.accountSid") as string || newNotificationSettings.whatsapp?.twilio?.accountSid || '',
                authToken: formData.get("whatsapp.twilio.authToken") as string || newNotificationSettings.whatsapp?.twilio?.authToken || '',
                fromNumber: formData.get("whatsapp.twilio.fromNumber") as string || newNotificationSettings.whatsapp?.twilio?.fromNumber || '',
            }
        };
    }
    
    // --- Update Nodemailer settings ---
    if (formData.has("email.nodemailer.host")) {
        newNotificationSettings.email = {
            provider: 'nodemailer',
            nodemailer: {
                host: formData.get("email.nodemailer.host") as string || newNotificationSettings.email?.nodemailer?.host || '',
                port: Number(formData.get("email.nodemailer.port")) || newNotificationSettings.email?.nodemailer?.port || 587,
                secure: formData.get("email.nodemailer.secure") === 'on',
                user: formData.get("email.nodemailer.user") as string || newNotificationSettings.email?.nodemailer?.user || '',
                pass: formData.get("email.nodemailer.pass") as string || newNotificationSettings.email?.nodemailer?.pass || '',
                from: formData.get("email.nodemailer.from") as string || newNotificationSettings.email?.nodemailer?.from || '',
            }
        };
    }
    
    const updates = {
      notificationSettings: newNotificationSettings
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
