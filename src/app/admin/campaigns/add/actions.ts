
// src/app/admin/campaigns/add/actions.ts

"use server";

import { createCampaign, getCampaign } from "@/services/campaign-service";
import { revalidatePath } from "next/cache";
import { CampaignStatus, DonationType, Lead, Donation, Campaign, User } from "@/services/types";
import { Timestamp, writeBatch } from "firebase/firestore";
import { db } from "@/services/firebase";
import { doc } from "firebase/firestore";
import { updatePublicCampaign, enrichCampaignWithPublicStats } from '@/services/public-data-service';
import { uploadFile } from "@/services/storage-service";
import { createLead } from "@/services/lead-service";
import { getUser } from "@/services/user-service";


interface FormState {
    success: boolean;
    error?: string;
}

export async function handleCreateCampaign(formData: FormData): Promise<FormState> {
  const adminUserId = formData.get('adminUserId') as string;
  if (!adminUserId) {
    return { success: false, error: 'Admin user not found.' };
  }

  try {
    const adminUser = await getUser(adminUserId);
    if (!adminUser) {
        return { success: false, error: 'Admin user details could not be loaded.' };
    }

    const name = formData.get('name') as string;
    const campaignId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let imageUrl: string | undefined;
    
    const status = formData.get('status') as CampaignStatus;
    const goalCalculationMethod = formData.get('goalCalculationMethod') as 'manual' | 'auto';
    
    const imageFile = formData.get('image') as File | null;
    if (imageFile && imageFile.size > 0) {
        const uploadPath = `campaigns/${campaignId}/images/`;
        imageUrl = await uploadFile(imageFile, uploadPath);
    }
    
    const collectedAmount = status === 'Completed' ? parseFloat(formData.get("collectedAmount") as string) : 0;
    
    let goal = parseFloat(formData.get('goal') as string);
    const fixedAmountPerBeneficiary = parseFloat(formData.get('fixedAmountPerBeneficiary') as string);
    const targetBeneficiaries = parseInt(formData.get('targetBeneficiaries') as string, 10);

    if (goalCalculationMethod === 'auto' && fixedAmountPerBeneficiary > 0 && targetBeneficiaries > 0) {
        goal = fixedAmountPerBeneficiary * targetBeneficiaries;
    }


    const newCampaignData = {
        id: campaignId,
        name: name,
        description: formData.get('description') as string,
        goal: goal,
        startDate: new Date(formData.get('startDate') as string),
        endDate: new Date(formData.get('endDate') as string),
        status: status,
        imageUrl: imageUrl,
        acceptableDonationTypes: formData.getAll('acceptableDonationTypes') as DonationType[],
        linkedCompletedCampaignIds: formData.getAll('linkedCompletedCampaignIds') as string[] || [],
        collectedAmount: collectedAmount,
        isHistoricalRecord: status === 'Completed',
        source: 'Manual Entry',
        fixedAmountPerBeneficiary: goalCalculationMethod === 'auto' ? fixedAmountPerBeneficiary : undefined,
        targetBeneficiaries: goalCalculationMethod === 'auto' ? targetBeneficiaries : undefined,
    };

    // Create the campaign first
    const newCampaign = await createCampaign(newCampaignData);
    
    const linkedLeadIds = formData.getAll('linkedLeadIds') as string[];
    const linkedDonationIds = formData.getAll('linkedDonationIds') as string[];
    const linkedBeneficiaryIds = formData.getAll('linkedBeneficiaryIds') as string[];

    // --- Automatically create leads for linked beneficiaries ---
    if (linkedBeneficiaryIds.length > 0) {
      for (const beneficiaryId of linkedBeneficiaryIds) {
          const beneficiary = await getUser(beneficiaryId);
          if (!beneficiary) continue;

          // Create a simple lead associated with this campaign
          const leadData: Partial<Lead> = {
              name: beneficiary.name,
              beneficiaryId: beneficiary.id,
              campaignId: newCampaign.id,
              campaignName: newCampaign.name,
              purpose: newCampaign.acceptableDonationTypes?.[0] as any || 'Relief Fund',
              category: 'Campaign Default',
              helpRequested: 0, // Set to 0, can be updated later
              caseDetails: `This case was automatically generated for the "${newCampaign.name}" campaign.`,
          };
          const newLead = await createLead(leadData, adminUser);
          linkedLeadIds.push(newLead.id); // Add the new lead to the list to be linked
      }
    }
    // --- End auto lead creation ---

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
    // Return the clean, specific error message from the service
    return {
      success: false,
      error: error,
    };
  }
}
