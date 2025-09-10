

"use server";

import { createDonation, getDonationByTransactionId, updateDonation } from "@/services/donation-service";
import { getUser, getUserByUpiId, getUserByBankAccountNumber, getUserByPhone } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import type { Donation, DonationPurpose, DonationType, PaymentMethod, UserRole, User, ExtractDonationDetailsOutput } from "@/services/types";
import { Timestamp } from "firebase/firestore";
import { uploadFile } from "@/services/storage-service";
import { extractDonationDetails } from "@/ai/flows/extract-donation-details-flow";
import { getCampaign } from "@/services/campaign-service";


interface FormState {
    success: boolean;
    error?: string;
    donationId?: string;
}

export async function handleAddDonation(
  formData: FormData
): Promise<FormState> {
  const adminUserId = formData.get("adminUserId") as string;
  
  if (!adminUserId) {
    return { success: false, error: "Could not identify the administrator performing this action. Please log out and back in." };
  }

  try {
    const adminUser = await getUser(adminUserId); // Fetch admin user details for logging
    if (!adminUser) {
        return { success: false, error: "Admin user not found for logging." };
    }
    
    const donorId = formData.get("donorId") as string;
    if (!donorId) {
        return { success: false, error: "Donor ID is missing." };
    }
    const donor = await getUser(donorId);
    if (!donor || !donor.userKey) {
        return { success: false, error: "Selected donor user not found or is missing a User Key." };
    }

    const transactionId = formData.get("transactionId") as string | undefined;
    if (transactionId) {
        const existingDonation = await getDonationByTransactionId(transactionId);
        if (existingDonation) {
            return { success: false, error: `A donation with Transaction ID "${transactionId}" already exists.` };
        }
    }

    const screenshotFile = formData.get("paymentScreenshot") as File | null;
    
    const donationDateStr = formData.get("donationDate") as string;
    const donationDate = donationDateStr ? Timestamp.fromDate(new Date(donationDateStr)) : Timestamp.now();
    
    const campaignId = formData.get("campaignId") as string | undefined;
    let campaignName: string | undefined;
    if (campaignId && campaignId !== 'none') {
        const campaign = await getCampaign(campaignId);
        campaignName = campaign?.name;
    }

    const createDonationRecord = async (data: Partial<Donation>) => {
        let proofUrl: string | undefined = undefined;
        // Create a temporary donation record to get an ID for the upload path
        const tempDonation = await createDonation({
            ...data,
            donorId: donor.id!,
            donorName: donor.name,
            status: "Pending verification",
            donationDate: donationDate,
            leadId: formData.get("leadId") === 'none' ? undefined : formData.get("leadId") as string | undefined,
            campaignId: campaignId === 'none' ? undefined : campaignId,
            campaignName: campaignName,
        }, adminUserId, adminUser.name, adminUser.email);

        if(screenshotFile && screenshotFile.size > 0) {
            const uploadPath = `donations/${donor.userKey}/${tempDonation.id}/proofs/`;
            proofUrl = await uploadFile(screenshotFile, uploadPath);
            await updateDonation(tempDonation.id!, { paymentScreenshotUrls: [proofUrl] });
        }
        
        // Return the final donation object with all details
        return { ...tempDonation, paymentScreenshotUrls: proofUrl ? [proofUrl] : [] };
    };
    
    const includePledge = formData.get("includePledge") === 'true';
    const pledgeAmount = includePledge ? donor.monthlyPledgeAmount || 0 : 0;
    
    const includeTip = formData.get("includeTip") === 'true';
    const tipAmount = includeTip ? parseFloat(formData.get("tipAmount") as string) : 0;

    // Create Pledge Donation if applicable
    if (pledgeAmount > 0) {
      await createDonationRecord({
        amount: pledgeAmount,
        type: 'Sadaqah', // Pledges are Sadaqah
        purpose: 'Monthly Pledge',
        transactionId: transactionId,
        notes: `Monthly pledge fulfillment as part of transaction ID: ${transactionId}`,
      });
    }
    
    // Create Tip Donation if applicable
    if (tipAmount > 0) {
        await createDonationRecord({
            amount: tipAmount,
            type: 'Sadaqah', // Tips are Sadaqah
            purpose: 'To Organization Use',
            transactionId: transactionId,
            notes: `Support for organization as part of transaction ID: ${transactionId}`,
        });
    }

    // Create Primary Donation
    const primaryAmount = parseFloat(formData.get("amount") as string);
    const primaryDonation = await createDonationRecord({
        amount: primaryAmount,
        type: formData.get("type") as DonationType,
        purpose: formData.get("purpose") as DonationPurpose, // Now required
        status: formData.get("status") as DonationStatus,
        transactionId: transactionId,
        paymentMethod: formData.get("paymentMethod") as PaymentMethod,
        isAnonymous: formData.get("isAnonymous") === 'true',
        notes: formData.get("notes") as string | undefined,
    });

    revalidatePath("/admin/donations");

    return {
      success: true,
      donationId: primaryDonation.id,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error adding donation:", error);
    return {
      success: false,
      error: `Failed to add donation: ${error}`,
    };
  }
}

interface AvailabilityResult {
    isAvailable: boolean;
    existingDonationId?: string;
}

export async function checkTransactionId(transactionId: string): Promise<AvailabilityResult> {
    if (!transactionId) return { isAvailable: true };
    const existingDonation = await getDonationByTransactionId(transactionId);
    if (existingDonation) {
        return { isAvailable: false, existingDonationId: existingDonation.id };
    }
    return { isAvailable: true };
}

export async function handleExtractDonationDetails(rawText: string): Promise<{ success: boolean; details?: ExtractDonationDetailsOutput; error?: string }> {
    try {
        if (!rawText) {
            return { success: false, error: "No text provided to extract details from." };
        }
        const extractedDetails = await extractDonationDetails({ rawText });
        return { success: true, details: extractedDetails };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown AI error occurred.";
        console.error("Error extracting donation details from text:", error);
        return { success: false, error };
    }
}
