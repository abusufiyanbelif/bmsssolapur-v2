

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
    
    await updateCampaign(campaignId, {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        goal: parseFloat(formData.get('goal') as string),
        startDate: new Date(formData.get('startDate') as string),
        endDate: new Date(formData.get('endDate') as string),
        status: formData.get('status') as CampaignStatus,
        imageUrl: imageUrl,
        acceptableDonationTypes: formData.getAll('acceptableDonationTypes') as DonationType[],
    });
    
    const updatedCampaign = await getCampaign(campaignId);
    if(updatedCampaign) {
      const enrichedCampaign = await enrichCampaignWithPublicStats(updatedCampaign);
      await updatePublicCampaign(enrichedCampaign);
    }
    
    revalidatePath("/admin/campaigns");
    revalidatePath(`/admin/campaigns/${campaignId}/edit`);

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
