
"use server";

import { updateOrganization, Organization } from "@/services/organization-service";
import { revalidatePath } from "next/cache";

interface FormState {
    success: boolean;
    error?: string;
}

// In a real app, you would upload the file to a storage service like Firebase Storage
// and get a URL. For this prototype, we'll just acknowledge the file was received.
async function handleFileUpload(file: File): Promise<string> {
    console.log(`Received QR Code file: ${file.name}, size: ${file.size} bytes`);
    // Placeholder for file upload logic
    return `https://placehold.co/400x400.png?text=qr-code`;
}


export async function handleUpdateOrganization(
  orgId: string,
  formData: FormData
): Promise<FormState> {
  
  try {
    const qrCodeFile = formData.get("qrCodeFile") as File | null;
    let qrCodeUrl = formData.get('qrCodeUrl') as string;
    
    if (qrCodeFile && qrCodeFile.size > 0) {
        qrCodeUrl = await handleFileUpload(qrCodeFile);
    }

    const updates: Partial<Organization> = {
        name: formData.get('name') as string,
        logoUrl: formData.get('logoUrl') as string,
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
