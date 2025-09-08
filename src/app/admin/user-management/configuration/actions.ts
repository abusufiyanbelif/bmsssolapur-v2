
"use server";

import { updateAppSettings, AppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateUserConfiguration(
  formData: FormData
): Promise<FormState> {
  
  try {
    const updates = {
      userConfiguration: {
        isAadhaarMandatory: formData.get("isAadhaarMandatory") === 'on',
      },
    };

    await updateAppSettings(updates);
    
    revalidatePath("/admin/user-management/configuration");
    revalidatePath("/admin/leads/add");
    revalidatePath("/register");

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating user configuration:", error);
    return {
      success: false,
      error: error,
    };
  }
}
