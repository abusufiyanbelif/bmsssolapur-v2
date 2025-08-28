

"use server";

import { updateCampaign } from "@/services/campaign-service";
import { revalidatePath } from "next/cache";
import { CampaignStatus, DonationType } from "@/services/types";
import { Timestamp } from "firebase/firestore";

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
        startDate: Timestamp.fromDate(formData.startDate),
        endDate: Timestamp.fromDate(formData.endDate),
        status: formData.status,
        acceptableDonationTypes: formData.acceptableDonationTypes,
    });
    
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
