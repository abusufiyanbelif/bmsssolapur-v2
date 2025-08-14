
"use server";

import { createCampaign } from "@/services/campaign-service";
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

export async function handleCreateCampaign(formData: CampaignFormData): Promise<FormState> {
  try {
    await createCampaign({
        name: formData.name,
        description: formData.description,
        goal: formData.goal,
        startDate: Timestamp.fromDate(formData.startDate),
        endDate: Timestamp.fromDate(formData.endDate),
        status: formData.status,
        acceptableDonationTypes: formData.acceptableDonationTypes,
    });
    
    revalidatePath("/admin/campaigns");

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error creating campaign:", error);
    return {
      success: false,
      error: error,
    };
  }
}
