

"use server";

import { updateCampaign, getCampaign } from "@/services/campaign-service";
import { revalidatePath } from "next/cache";
import { CampaignStatus, DonationType } from "@/services/types";
import { updatePublicCampaign, enrichCampaignWithPublicStats } from "@/services/public-data-service";


interface FormState {
    success: boolean;
    error?: string;
}

interface CampaignFormData {
    name: string;
    description: string;
    goal: number;
    startDate: Date;
    endDate: Date;
    status: CampaignStatus;
    acceptableDonationTypes: DonationType[];
}

export async function handleUpdateCampaign(campaignId: string, formData: CampaignFormData): Promise<FormState> {
  try {
    await updateCampaign(campaignId, {
        name: formData.name,
        description: formData.description,
        goal: formData.goal,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        acceptableDonationTypes: formData.acceptableDonationTypes,
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
