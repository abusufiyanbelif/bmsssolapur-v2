
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
    const updates = JSON.parse(JSON.stringify(currentSettings.notificationSettings || {}));

    // Check which section is being submitted and update accordingly
    if (formData.has('sms.provider')) {
      updates.sms.provider = formData.get('sms.provider') as 'firebase' | 'twilio';
    }

    if (formData.has('sms.twilio.enabled')) {
      updates.sms.twilio.enabled = formData.get('sms.twilio.enabled') === 'on';
      updates.sms.twilio.accountSid = formData.get('sms.twilio.accountSid') as string;
      updates.sms.twilio.authToken = formData.get('sms.twilio.authToken') as string;
      updates.sms.twilio.verifySid = formData.get('sms.twilio.verifySid') as string;
      updates.sms.twilio.fromNumber = formData.get('sms.twilio.fromNumber') as string;
    }
    
    if (formData.has('whatsapp.twilio.enabled')) {
       if (!updates.whatsapp) updates.whatsapp = { provider: 'twilio', twilio: {} };
       updates.whatsapp.twilio.enabled = formData.get('whatsapp.twilio.enabled') === 'on';
       updates.whatsapp.twilio.fromNumber = formData.get('whatsapp.twilio.fromNumber') as string;
    }
    
    if (formData.has('email.nodemailer.enabled')) {
        if (!updates.email) updates.email = { provider: 'nodemailer', nodemailer: {} };
        updates.email.nodemailer.enabled = formData.get('email.nodemailer.enabled') === 'on';
        updates.email.nodemailer.host = formData.get('email.nodemailer.host') as string;
        updates.email.nodemailer.port = Number(formData.get('email.nodemailer.port'));
        updates.email.nodemailer.secure = formData.get('email.nodemailer.secure') === 'on';
        updates.email.nodemailer.user = formData.get('email.nodemailer.user') as string;
        updates.email.nodemailer.pass = formData.get('email.nodemailer.pass') as string;
        updates.email.nodemailer.from = formData.get('email.nodemailer.from') as string;
    }
    
    await updateAppSettings({ notificationSettings: updates });
    
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
