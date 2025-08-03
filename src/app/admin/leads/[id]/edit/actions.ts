
"use server";

import { updateLead, Lead, LeadPurpose, LeadStatus, LeadVerificationStatus } from "@/services/lead-service";
import { revalidatePath } from "next/cache";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateLead(
  leadId: string,
  formData: FormData
): Promise<FormState> {
  const rawFormData = Object.fromEntries(formData.entries());

  try {
    const updates: Partial<Lead> = {
        campaignName: rawFormData.campaignName as string | undefined,
        purpose: rawFormData.purpose as LeadPurpose,
        subCategory: rawFormData.subCategory as string | undefined,
        otherCategoryDetail: rawFormData.otherCategoryDetail as string | undefined,
        helpRequested: parseFloat(rawFormData.helpRequested as string),
        caseDetails: rawFormData.caseDetails as string | undefined,
        isLoan: rawFormData.isLoan === 'on',
        status: rawFormData.status as LeadStatus,
        verifiedStatus: rawFormData.verifiedStatus as LeadVerificationStatus,
    };

    await updateLead(leadId, updates);
    
    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${leadId}`);
    revalidatePath(`/admin/leads/${leadId}/edit`);

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating lead:", error);
    return {
      success: false,
      error: error,
    };
  }
}
