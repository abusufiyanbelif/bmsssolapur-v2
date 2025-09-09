
"use server";

import { updateAppSettings, AppSettings, getAppSettings } from "@/services/app-settings-service";
import { revalidatePath } from "next/cache";
import type { UserConfiguration } from "@/services/types";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateUserConfiguration(
  formData: FormData
): Promise<FormState> {
  
  try {
    const currentSettings = await getAppSettings();
    
    const userConfig: UserConfiguration = {
      // Safely copy existing settings
      ...(currentSettings.userConfiguration || {}),
      Donor: {
        isAadhaarMandatory: formData.get("Donor.isAadhaarMandatory") === 'on',
        isPanMandatory: formData.get("Donor.isPanMandatory") === 'on',
        isAddressMandatory: formData.get("Donor.isAddressMandatory") === 'on',
        isBankAccountMandatory: formData.get("Donor.isBankAccountMandatory") === 'on',
      },
      Beneficiary: {
        isAadhaarMandatory: formData.get("Beneficiary.isAadhaarMandatory") === 'on',
        isPanMandatory: formData.get("Beneficiary.isPanMandatory") === 'on',
        isAddressMandatory: formData.get("Beneficiary.isAddressMandatory") === 'on',
        isBankAccountMandatory: formData.get("Beneficiary.isBankAccountMandatory") === 'on',
      },
      Referral: {
        isAadhaarMandatory: formData.get("Referral.isAadhaarMandatory") === 'on',
        isPanMandatory: formData.get("Referral.isPanMandatory") === 'on',
        isAddressMandatory: formData.get("Referral.isAddressMandatory") === 'on',
        isBankAccountMandatory: formData.get("Referral.isBankAccountMandatory") === 'on',
      },
       Admin: {
        isAadhaarMandatory: formData.get("Admin.isAadhaarMandatory") === 'on',
        isPanMandatory: formData.get("Admin.isPanMandatory") === 'on',
        isAddressMandatory: formData.get("Admin.isAddressMandatory") === 'on',
        isBankAccountMandatory: formData.get("Admin.isBankAccountMandatory") === 'on',
      },
    };

    const updates = {
      userConfiguration: userConfig,
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
