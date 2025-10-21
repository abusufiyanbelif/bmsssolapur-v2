
// src/app/admin/donations/add/actions.ts

"use server";

import { createDonation, getDonationByTransactionId, updateDonation } from "@/services/donation-service";
import { getUserByUpiId, getUserByBankAccountNumber, getUserByPhone, createUser, updateUser, getUser as getUserService } from "@/services/user-service";
import { checkAvailability as checkUserAvailability } from "@/app/admin/user-management/add/actions";
import { revalidatePath } from "next/cache";
import type { Donation, DonationPurpose, DonationType, PaymentMethod, UserRole, User, ExtractDonationDetailsOutput } from "@/services/types";
import { Timestamp, arrayUnion, collection } from "firebase/firestore";
import { uploadFile } from "@/services/storage-service";
import { extractDonationDetails } from "@/ai/flows/extract-donation-details-flow";
import { getCampaign } from "@/services/campaign-service";
import { db } from "@/services/firebase";
import { doc } from "firebase/firestore";

interface FormState {
    success: boolean;
    error?: string;
    donationId?: string;
}

export async function getUserAction(userId: string) {
    return getUserService(userId);
}

export async function handleAddDonation(
  formData: FormData
): Promise<FormState> {
  const adminUserId = formData.get("adminUserId") as string;
  
  if (!adminUserId) {
    return { success: false, error: "Could not identify the administrator performing this action. Please log out and back in." };
  }

  try {
    const adminUser = await getUserService(adminUserId); // Fetch admin user details for logging
    if (!adminUser) {
        return { success: false, error: "Admin user not found for logging." };
    }
    
    const transactionId = formData.get("transactionId") as string | undefined;
    if (transactionId) {
        const existingDonation = await getDonationByTransactionId(transactionId);
        if (existingDonation) {
            return { success: false, error: `A donation with Transaction ID "${transactionId}" already exists.` };
        }
    }
    
    let donor: User | null = null;
    const donorType = formData.get('donorType');

    if (donorType === 'new') {
        const newUserPayload: Partial<User> = {
            userId: formData.get("newDonorUserId") as string | undefined,
            name: `${formData.get("newDonorFirstName") as string} ${formData.get("newDonorMiddleName") || ''} ${formData.get("newDonorLastName") as string}`.replace(/\s+/g, ' ').trim(),
            firstName: formData.get("newDonorFirstName") as string,
            middleName: formData.get("newDonorMiddleName") as string || '',
            lastName: formData.get("newDonorLastName") as string,
            fatherName: formData.get("newDonorFatherName") as string || undefined,
            phone: formData.get("newDonorPhone") as string,
            email: formData.get("newDonorEmail") as string || undefined,
            aadhaarNumber: formData.get("newDonorAadhaar") as string || undefined,
            gender: formData.get("gender") as 'Male' | 'Female' | 'Other',
            roles: ['Donor'],
            isActive: true,
            source: 'Manual Entry'
        };
        
        if (!newUserPayload.firstName || !newUserPayload.lastName || !newUserPayload.phone || !newUserPayload.gender) {
            return { success: false, error: "New donor requires First Name, Last Name, Phone, and Gender." };
        }
        
        try {
            donor = await createUser(newUserPayload);
        } catch (e) {
            const error = e instanceof Error ? e.message : "An unknown error occurred creating the donor.";
            console.error("Error creating new donor from donation form:", error);
            return { success: false, error: `Failed to create donor: ${error}` };
        }

    } else {
        const donorId = formData.get("donorId") as string;
        if (!donorId) {
            return { success: false, error: "An existing donor must be selected." };
        }
        donor = await getUserService(donorId);
    }
    
    if (!donor || !donor.userKey) {
        return { success: false, error: "Selected or created donor user not found or is missing a User Key." };
    }
    
    // --- Post-creation Profile Updates ---
    const updateDonorPhone = formData.get('updateDonorPhone') === 'on' && formData.get('donorPhone');
    const updateDonorUpiId = formData.get('updateDonorUpiId') === 'on' && formData.get('senderUpiId');

    if(updateDonorPhone || updateDonorUpiId) {
        const profileUpdates: Partial<User> = {};
        if (updateDonorPhone) {
            profileUpdates.upiPhoneNumbers = arrayUnion(formData.get('donorPhone')) as any;
        }
        if (updateDonorUpiId) {
            profileUpdates.upiIds = arrayUnion(formData.get('senderUpiId')) as any;
        }
        await updateUser(donor.id!, profileUpdates);
    }
    // --- End Profile Updates ---

    const screenshotFile = formData.get("paymentScreenshot") as File | null;
    
    const donationDateStr = formData.get("donationDate") as string;
    const donationDate = donationDateStr ? new Date(donationDateStr) : new Date();
    
    const campaignId = formData.get("campaignId") as string | undefined;
    let campaignName: string | undefined;
    if (campaignId && campaignId !== 'none') {
        const campaign = await getCampaign(campaignId);
        campaignName = campaign?.name;
    }
    
    const source = formData.get("source") as string || 'Manual (Admin)';

    const createDonationRecord = async (data: Partial<Donation>) => {
        let proofUrl: string | undefined = undefined;
        // Create a temporary donation record to get an ID for the upload path
        const tempDonation = await createDonation({
            ...data,
            donorId: donor!.id!,
            donorName: donor!.name,
            status: "Pending verification",
            donationDate: donationDate,
            leadId: formData.get("leadId") === 'none' ? undefined : formData.get("leadId") as string | undefined,
            campaignId: campaignId === 'none' ? undefined : campaignId,
            campaignName: campaignName,
            source: source,
        }, adminUser.id!, adminUser.name, adminUser.email);

        if(screenshotFile && screenshotFile.size > 0) {
            const uploadPath = `donations/${donor!.userKey}/${tempDonation.id}/proofs/`;
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
        isAnonymous: formData.get("isAnonymous") === 'on',
        notes: formData.get("notes") as string | undefined,
        paymentApp: formData.get("paymentApp") as string | undefined,
        time: formData.get("time") as string | undefined,
        senderName: formData.get("senderName") as string | undefined,
        senderBankName: formData.get("senderBankName") as string | undefined,
        senderUpiId: formData.get("senderUpiId") as string | undefined,
        recipientName: formData.get("recipientName") as string | undefined,
        recipientUpiId: formData.get("recipientUpiId") as string | undefined,
        phonePeSenderName: formData.get("phonePeSenderName") as string | undefined,
    });

    revalidatePath("/admin/donations");

    return {
      success: true,
      donationId: primaryDonation.id,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error adding donation:", error);
    // Return the clean, specific error message from the service
    return {
      success: false,
      error: error,
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
