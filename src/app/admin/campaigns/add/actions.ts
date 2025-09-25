

"use server";

import { createCampaign, getCampaign } from "@/services/campaign-service";
import { revalidatePath } from "next/cache";
import { CampaignStatus, DonationType, Lead, Donation } from "@/services/types";
import { Timestamp, writeBatch } from "firebase/firestore";
import { db } from "@/services/firebase";
import { doc } from "firebase/firestore";
import { updatePublicCampaign, enrichCampaignWithPublicStats } from '@/services/public-data-service';
import { uploadFile } from "@/services/storage-service";


interface FormState {
    success: boolean;
    error?: string;
}

export async function handleCreateCampaign(formData: FormData): Promise<FormState> {
  try {
    const name = formData.get('name') as string;
    const campaignId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let imageUrl: string | undefined;
    const isHistoricalRecord = formData.get("isHistoricalRecord") === 'on';

    const imageFile = formData.get('image') as File | null;
    if (imageFile && imageFile.size > 0) {
        const uploadPath = `campaigns/${campaignId}/images/`;
        imageUrl = await uploadFile(imageFile, uploadPath);
    }
    
    // Create the campaign first
    const newCampaign = await createCampaign({
        id: campaignId,
        name: name,
        description: formData.get('description') as string,
        goal: parseFloat(formData.get('goal') as string),
        startDate: new Date(formData.get('startDate') as string),
        endDate: new Date(formData.get('endDate') as string),
        status: formData.get('status') as CampaignStatus,
        imageUrl: imageUrl,
        acceptableDonationTypes: formData.getAll('acceptableDonationTypes') as DonationType[],
        linkedCompletedCampaignIds: formData.getAll('linkedCompletedCampaignIds') as string[] || [],
        collectedAmount: isHistoricalRecord ? parseFloat(formData.get("collectedAmount") as string) : 0,
        isHistoricalRecord: isHistoricalRecord,
    });
    
    const linkedLeadIds = formData.getAll('linkedLeadIds') as string[];
    const linkedDonationIds = formData.getAll('linkedDonationIds') as string[];

    // If there are linked items, update them in a batch
    if (linkedLeadIds.length > 0 || linkedDonationIds.length > 0) {
        const batch = writeBatch(db);
        const updatePayload = {
            campaignId: newCampaign.id,
            campaignName: newCampaign.name,
        };

        // Update leads
        linkedLeadIds.forEach(leadId => {
            const leadRef = doc(db, 'leads', leadId);
            batch.update(leadRef, updatePayload);
        });

        // Update donations
        linkedDonationIds.forEach(donationId => {
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
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/campaigns", 'layout');

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
