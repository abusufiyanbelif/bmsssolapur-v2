
"use server";

import { updateCampaign, getCampaign } from "@/services/campaign-service";
import { revalidatePath } from "next/cache";
import { CampaignStatus, DonationType } from "@/services/types";
import { updatePublicCampaign, enrichCampaignWithPublicStats } from "@/services/public-data-service";
import { uploadFile } from "@/services/storage-service";


interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateCampaign(campaignId: string, formData: FormData): Promise<FormState> {
  try {
    let imageUrl: string | undefined = formData.get('existingImageUrl') as string | undefined;

    const imageFile = formData.get('image') as File | null;
    if (imageFile && imageFile.size > 0) {
        const uploadPath = `campaigns/${campaignId}/images/`;
        imageUrl = await uploadFile(imageFile, uploadPath);
    }
    
    const goalCalculationMethod = formData.get('goalCalculationMethod') as 'manual' | 'auto';
    let goal = parseFloat(formData.get('goal') as string);
    const fixedAmountPerBeneficiary = parseFloat(formData.get('fixedAmountPerBeneficiary') as string);
    const targetBeneficiaries = parseInt(formData.get('targetBeneficiaries') as string, 10);
    
    if (goalCalculationMethod === 'auto' && fixedAmountPerBeneficiary > 0 && targetBeneficiaries > 0) {
        goal = fixedAmountPerBeneficiary * targetBeneficiaries;
    }
    
    await updateCampaign(campaignId, {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        goal: goal,
        startDate: new Date(formData.get('startDate') as string),
        endDate: new Date(formData.get('endDate') as string),
        status: formData.get('status') as CampaignStatus,
        imageUrl: imageUrl,
        acceptableDonationTypes: formData.getAll('acceptableDonationTypes') as DonationType[],
        linkedCompletedCampaignIds: formData.getAll('linkedCompletedCampaignIds') as string[] || [],
        fixedAmountPerBeneficiary: goalCalculationMethod === 'auto' ? fixedAmountPerBeneficiary : undefined,
        targetBeneficiaries: goalCalculationMethod === 'auto' ? targetBeneficiaries : undefined,
    });
    
    const updatedCampaign = await getCampaign(campaignId);
    if(updatedCampaign) {
      const enrichedCampaign = await enrichCampaignWithPublicStats(updatedCampaign);
      await updatePublicCampaign(enrichedCampaign, updatedCampaign.status === 'Cancelled');
    }
    
    revalidatePath("/admin/campaigns");
    revalidatePath(`/admin/campaigns/${campaignId}/edit`);
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/campaigns", 'layout');

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred while updating the campaign.";
    console.error("Error updating campaign:", error);
    return {
      success: false,
      error: `Failed to update campaign: ${error}`,
    };
  }
}
