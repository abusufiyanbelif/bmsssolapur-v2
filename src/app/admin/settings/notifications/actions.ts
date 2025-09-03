

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
    const updates = {
      notificationSettings: {
        sms: {
            provider: 'twilio' as const,
            twilio: {
                accountSid: formData.get("sms.twilio.accountSid") as string || '',
                authToken: formData.get("sms.twilio.authToken") as string || '',
                verifySid: formData.get("sms.twilio.verifySid") as string || '',
                fromNumber: formData.get("sms.twilio.fromNumber") as string || '',
            }
        },
        whatsapp: {
             provider: 'twilio' as const,
             twilio: {
                accountSid: formData.get("whatsapp.twilio.accountSid") as string || '',
                authToken: formData.get("whatsapp.twilio.authToken") as string || '',
                fromNumber: formData.get("whatsapp.twilio.fromNumber") as string || '',
             }
        },
        email: {
            provider: 'nodemailer' as const,
            nodemailer: {
                host: formData.get("email.nodemailer.host") as string || '',
                port: Number(formData.get("email.nodemailer.port")) || 587,
                secure: formData.get("email.nodemailer.secure") === 'on',
                user: formData.get("email.nodemailer.user") as string || '',
                pass: formData.get("email.nodemailer.pass") as string || '',
                from: formData.get("email.nodemailer.from") as string || '',
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
