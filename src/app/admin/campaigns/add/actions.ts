

"use server";

import { createCampaign, getCampaign } from "@/services/campaign-service";
import { revalidatePath } from "next/cache";
import { CampaignStatus, DonationType, Lead, Donation } from "@/services/types";
import { Timestamp, writeBatch } from "firebase/firestore";
import { db } from "@/services/firebase";
import { doc } from "firebase/firestore";
import { updatePublicCampaign, enrichCampaignWithPublicStats } from '@/services/public-data-service';


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
    linkedLeadIds?: string[];
    linkedDonationIds?: string[];
}

export async function handleCreateCampaign(formData: CampaignFormData): Promise<FormState> {
  try {
    const campaignId = formData.name.toLowerCase().replace(/\s+/g, '-');
    
    // Create the campaign first
    const newCampaign = await createCampaign({
        id: campaignId,
        name: formData.name,
        description: formData.description,
        goal: formData.goal,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        acceptableDonationTypes: formData.acceptableDonationTypes,
    });
    
    // If there are linked items, update them in a batch
    if (formData.linkedLeadIds?.length || formData.linkedDonationIds?.length) {
        const batch = writeBatch(db);
        const updatePayload = {
            campaignId: newCampaign.id,
            campaignName: newCampaign.name,
        };

        // Update leads
        formData.linkedLeadIds?.forEach(leadId => {
            const leadRef = doc(db, 'leads', leadId);
            batch.update(leadRef, updatePayload);
        });

        // Update donations
        formData.linkedDonationIds?.forEach(donationId => {
            const donationRef = doc(db, 'donations', donationId);
            batch.update(donationRef, updatePayload);
        });

        await batch.commit();
    }
    
    // Enrich and update the public campaign document
    const campaignForPublic = await getCampaign(newCampaign.id!);
    if (campaignForPublic) {
        const enriched = await enrichCampaignWithPublicStats(campaignForPublic);
        await updatePublicCampaign(enriched);
    }
    
    revalidatePath("/admin/campaigns");
    revalidatePath("/admin/leads");
    revalidatePath("/admin/donations");

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred while creating the campaign.";
    console.error("Error creating campaign:", error);
    return {
      success: false,
      error: `Failed to create campaign: ${error}`,
    };
  }
}
