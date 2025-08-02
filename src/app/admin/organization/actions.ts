
"use server";

import { updateOrganization, Organization } from "@/services/organization-service";
import { revalidatePath } from "next/cache";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateOrganization(
  orgId: string,
  formData: FormData
): Promise<FormState> {
  
  try {
    const updates: Partial<Organization> = {
        name: formData.get('name') as string,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        registrationNumber: formData.get('registrationNumber') as string,
        panNumber: formData.get('panNumber') as string,
        contactEmail: formData.get('contactEmail') as string,
        contactPhone: formData.get('contactPhone') as string,
        website: formData.get('website') as string,
        upiId: formData.get('upiId') as string,
        qrCodeUrl: formData.get('qrCodeUrl') as string,
    };

    await updateOrganization(orgId, updates);
    
    revalidatePath("/admin/organization");
    revalidatePath("/organization");
    revalidatePath("/campaigns");

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating organization settings:", error);
    return {
      success: false,
      error: error,
    };
  }
}
