

"use server";

import { updateAppSettings, AppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateNotificationSettings(
  formData: FormData
): Promise<FormState> {
  
  try {
    const smsEnabled = formData.get("sms.twilio.enabled") === 'true';
    const whatsappEnabled = formData.get("whatsapp.twilio.enabled") === 'true';
    const emailEnabled = formData.get("email.nodemailer.enabled") === 'true';

    const updates = {
      notificationSettings: {
        sms: {
            provider: 'twilio',
            twilio: {
                accountSid: smsEnabled ? formData.get("sms.twilio.accountSid") as string : '',
                authToken: smsEnabled ? formData.get("sms.twilio.authToken") as string : '',
                verifySid: smsEnabled ? formData.get("sms.twilio.verifySid") as string : '',
                fromNumber: smsEnabled ? formData.get("sms.twilio.fromNumber") as string : '',
            }
        },
        whatsapp: {
             provider: 'twilio',
             twilio: {
                accountSid: whatsappEnabled ? formData.get("whatsapp.twilio.accountSid") as string : '',
                authToken: whatsappEnabled ? formData.get("whatsapp.twilio.authToken") as string : '',
                fromNumber: whatsappEnabled ? formData.get("whatsapp.twilio.fromNumber") as string : '',
             }
        },
        email: {
            provider: 'nodemailer',
            nodemailer: {
                host: emailEnabled ? formData.get("email.nodemailer.host") as string : '',
                port: emailEnabled ? Number(formData.get("email.nodemailer.port")) : 587,
                secure: emailEnabled ? formData.get("email.nodemailer.secure") === 'true' : true,
                user: emailEnabled ? formData.get("email.nodemailer.user") as string : '',
                pass: emailEnabled ? formData.get("email.nodemailer.pass") as string : '',
                from: emailEnabled ? formData.get("email.nodemailer.from") as string : '',
            }
        }
      }
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
