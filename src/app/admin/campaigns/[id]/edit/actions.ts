
// src/app/admin/campaigns/[id]/edit/actions.ts

"use server";

import { updateCampaign, getCampaign, createCampaign } from "@/services/campaign-service";
import { revalidatePath } from "next/cache";
import { CampaignStatus, DonationType, Lead, User, Campaign } from "@/services/types";
import { updatePublicCampaign, enrichCampaignWithPublicStats } from "@/services/public-data-service";
import { uploadFile } from "@/services/storage-service";
import { createLead as createLeadService } from "@/services/lead-service";
import { getUser } from "@/services/user-service";
import { writeBatch } from "firebase/firestore";
import { db } from "@/services/firebase";
import { doc } from "firebase/firestore";


interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateCampaign(campaignId: string, formData: FormData): Promise<FormState> {
  const adminUserId = formData.get('adminUserId') as string;

  try {
    const adminUser = adminUserId ? await getUser(adminUserId) : null;

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
    
    const linkedLeadIds = formData.getAll('linkedLeadIds') as string[];
    const linkedBeneficiaryIds = formData.getAll('linkedBeneficiaryIds') as string[];
    const status = formData.get('status') as CampaignStatus;

    const campaignUpdateData: Partial<Campaign> = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        goal: goal,
        startDate: new Date(formData.get('startDate') as string),
        endDate: new Date(formData.get('endDate') as string),
        status: status,
        imageUrl: imageUrl,
        acceptableDonationTypes: formData.getAll('acceptableDonationTypes') as DonationType[],
        linkedCompletedCampaignIds: formData.getAll('linkedCompletedCampaignIds') as string[] || [],
        fixedAmountPerBeneficiary: goalCalculationMethod === 'auto' ? fixedAmountPerBeneficiary : undefined,
        targetBeneficiaries: goalCalculationMethod === 'auto' ? targetBeneficiaries : undefined,
        leads: linkedLeadIds,
        collectedAmount: parseFloat(formData.get('collectedAmount') as string) || 0,
        isHistoricalRecord: status === 'Completed', // Set based on status
    };

    await updateCampaign(campaignId, campaignUpdateData);
    
    // --- Post-update linking logic ---
    if (adminUser) {
        const batch = writeBatch(db);
        const campaignPayload = {
            campaignId: campaignId,
            campaignName: campaignUpdateData.name,
        };

        // Link existing leads
        linkedLeadIds.forEach(leadId => {
            const leadRef = doc(db, 'leads', leadId);
            batch.update(leadRef, campaignPayload);
        });

        // Create and link new leads for beneficiaries
        for (const beneficiaryId of linkedBeneficiaryIds) {
            const beneficiary = await getUser(beneficiaryId);
            if (!beneficiary) continue;

            const newLeadData: Partial<Lead> = {
                name: beneficiary.name,
                beneficiaryId: beneficiary.id,
                ...campaignPayload,
                purpose: (campaignUpdateData.acceptableDonationTypes?.[0] as any) || 'Relief Fund',
                category: 'Campaign Default',
                helpRequested: fixedAmountPerBeneficiary > 0 ? fixedAmountPerBeneficiary : 0,
                caseDetails: `This case was automatically generated for the "${campaignUpdateData.name}" campaign.`,
            };
            // The createLeadService now correctly creates a new lead document.
            // We await it here to ensure it's created before the function finishes, although not strictly necessary if we don't need its ID immediately.
            await createLeadService(newLeadData, adminUser);
        }

        await batch.commit();
    }
    // --- End linking logic ---
    
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
