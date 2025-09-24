
"use server";

import { updateOrganization, Organization } from "@/services/organization-service";
import { revalidatePath } from "next/cache";
import { uploadFile } from "@/services/storage-service";


interface FormState {
    success: boolean;
    error?: string;
}


export async function handleUpdateOrganization(
  orgId: string,
  formData: FormData
): Promise<FormState> {
  
  try {
    const qrCodeFile = formData.get("qrCodeFile") as File | null;
    let qrCodeUrl = formData.get('qrCodeUrl') as string;
    
    const logoFile = formData.get("logoFile") as File | null;
    let logoUrl = formData.get('logoUrl') as string;

    if (logoFile && logoFile.size > 0) {
        const uploadPath = `organization/assets/logo/`;
        logoUrl = await uploadFile(logoFile, uploadPath);
    }
    
    if (qrCodeFile && qrCodeFile.size > 0) {
        const uploadPath = `organization/assets/qr-codes/`;
        qrCodeUrl = await uploadFile(qrCodeFile, uploadPath);
    }

    const updates: Partial<Organization> = {
        name: formData.get('name') as string,
        logoUrl: logoUrl,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        registrationNumber: formData.get('registrationNumber') as string,
        panNumber: formData.get('panNumber') as string,
        contactEmail: formData.get('contactEmail') as string,
        contactPhone: formData.get('contactPhone') as string,
        website: formData.get('website') as string,
        bankAccountName: formData.get('bankAccountName') as string,
        bankAccountNumber: formData.get('bankAccountNumber') as string,
        bankIfscCode: formData.get('bankIfscCode') as string,
        upiId: formData.get('upiId') as string,
        qrCodeUrl: qrCodeUrl,
    };

    await updateOrganization(orgId, updates);
    
    revalidatePath("/admin/organization");
    revalidatePath("/organization");
    revalidatePath("/campaigns");
    // Also revalidate pages that use the logo in the header/footer
    revalidatePath("/");
    revalidatePath("/home", "layout");


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
