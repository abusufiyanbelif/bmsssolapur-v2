


"use server";

import { createDonation, getDonationByTransactionId } from "@/services/donation-service";
import { getUser, getUserByUpiId, getUserByBankAccountNumber, getUserByPhone } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import type { Donation, DonationPurpose, DonationType, PaymentMethod, UserRole, ExtractDonationDetailsOutput, User } from "@/services/types";
import { Timestamp } from "firebase/firestore";
import type { ExtractDonationDetailsInput } from "@/ai/schemas";
import { uploadFile } from "@/services/storage-service";

interface FormState {
    success: boolean;
    error?: string;
    donation?: Donation;
}

// Helper to convert Base64 Data URL back to a File object
const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
};


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
    if (!donor) {
        return { success: false, error: "Selected donor user not found." };
    }

    const transactionId = formData.get("transactionId") as string | undefined;
    if (transactionId) {
        const existingDonation = await getDonationByTransactionId(transactionId);
        if (existingDonation) {
            return { success: false, error: `A donation with Transaction ID "${transactionId}" already exists.` };
        }
    }

    const screenshotFiles = formData.getAll("paymentScreenshots") as File[];
    const screenshotDataUrl = formData.get("paymentScreenshotDataUrl") as string | undefined;
    const leadId = formData.get("leadId") as string | undefined;

    // This function will create the donation record first to get an ID
    // Then it will upload the file to a path that includes this new ID
    const createDonationWithProof = async (donationData: Omit<Donation, 'id' | 'createdAt' | 'paymentScreenshotUrls'>, fileToUpload?: File) => {
        const createdDonation = await createDonation(donationData, adminUserId, adminUser.name, adminUser.email);
        
        if (fileToUpload) {
            let uploadPath = `donations/${createdDonation.id}/proofs/`;
            if (createdDonation.leadId) {
                 uploadPath = `leads/${createdDonation.leadId}/donations/${createdDonation.id}/`;
            }
            const url = await uploadFile(fileToUpload, uploadPath);
            // Update the donation with the screenshot URL
            await updateDonation(createdDonation.id!, { paymentScreenshotUrls: [url] });
            return { ...createdDonation, paymentScreenshotUrls: [url] };
        }
        return createdDonation;
    };
    
    const donationDateStr = formData.get("donationDate") as string;
    const donationDate = donationDateStr ? Timestamp.fromDate(new Date(donationDateStr)) : Timestamp.now();
    
    const baseDonationData: Omit<Donation, 'id' | 'createdAt' | 'paymentScreenshotUrls'> = {
        donorId: donor.id!,
        donorName: donor.name,
        isAnonymous: formData.get("isAnonymous") === 'true',
        status: "Pending verification",
        transactionId: transactionId,
        donationDate: donationDate,
        paymentApp: formData.get("paymentApp") as string | undefined,
        paymentMethod: formData.get("paymentMethod") as PaymentMethod | undefined,
    };
    
    const fileForUpload = screenshotDataUrl ? await dataUrlToFile(screenshotDataUrl, 'scanned-screenshot.png') : (screenshotFiles.length > 0 ? screenshotFiles[0] : undefined);
    
    const includePledge = formData.get("includePledge") === 'true';
    const pledgeAmount = includePledge ? donor.monthlyPledgeAmount || 0 : 0;
    
    const includeTip = formData.get("includeTip") === 'true';
    const tipAmount = includeTip ? parseFloat(formData.get("tipAmount") as string) : 0;

    // Create Pledge Donation if applicable
    if (pledgeAmount > 0) {
      await createDonationWithProof({
        ...baseDonationData,
        amount: pledgeAmount,
        type: 'Sadaqah', // Pledges are Sadaqah
        purpose: 'Monthly Pledge',
        notes: `Monthly pledge fulfillment as part of transaction ID: ${transactionId}`,
      }, fileForUpload); // Upload the same proof for this record
    }
    
    // Create Tip Donation if applicable
    if (tipAmount > 0) {
        await createDonationWithProof({
            ...baseDonationData,
            amount: tipAmount,
            type: 'Sadaqah', // Tips are Sadaqah
            purpose: 'To Organization Use',
            notes: `Support for organization as part of transaction ID: ${transactionId}`,
        }, fileForUpload); // And for this one
    }

    // Create Primary Donation
    const primaryAmount = parseFloat(formData.get("amount") as string);
    const primaryDonationData = {
        ...baseDonationData,
        amount: primaryAmount,
        type: formData.get("type") as DonationType,
        purpose: formData.get("purpose") as DonationPurpose, // Now required
        category: formData.get("category") as string | undefined,
        notes: formData.get("notes") as string | undefined,
        leadId: formData.get("linkToLead") === 'true' ? leadId : undefined,
        campaignId: formData.get("linkToCampaign") === 'true' ? formData.get("campaignId") as string | undefined : undefined,
    };

    const primaryDonation = await createDonationWithProof(primaryDonationData, fileForUpload);

    revalidatePath("/admin/donations");

    return {
      success: true,
      donation: primaryDonation,
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


const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

interface ScanResult {
    success: boolean;
    details?: ExtractDonationDetailsOutput;
    error?: string;
    donorFound?: boolean;
}

export async function scanProof(formData: FormData): Promise<ScanResult> {
    let lastError: string = "An unknown error occurred";
    const proofFile = formData.get("proofFile") as File | null;

    if (!proofFile) {
        return { success: false, error: "No file was provided for scanning." };
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const { extractDonationDetails } = await import('@/ai/flows/extract-donation-details-flow');
            
            const arrayBuffer = await proofFile.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const mimeType = proofFile.type;
            const dataUri = `data:${mimeType};base64,${base64}`;

            const extractedDetails = await extractDonationDetails({ photoDataUri: dataUri });
            
            // On success, try to find a matching donor
            let foundDonor: User | null = null;
            if (extractedDetails.senderUpiId) foundDonor = await getUserByUpiId(extractedDetails.senderUpiId);
            if (!foundDonor && extractedDetails.donorPhone) {
                 const phone = extractedDetails.donorPhone.replace(/\D/g,'').slice(-10);
                 foundDonor = await getUserByPhone(phone);
            }
            if (!foundDonor && extractedDetails.senderAccountNumber) foundDonor = await getUserByBankAccountNumber(extractedDetails.senderAccountNumber);

            return { 
                success: true, 
                details: { ...extractedDetails, donorId: foundDonor?.id },
                donorFound: !!foundDonor,
            };

        } catch (e) {
            lastError = e instanceof Error ? e.message : "An unknown error occurred";
            console.error(`Attempt ${attempt} failed:`, lastError);

            if (lastError.includes('503 Service Unavailable') && attempt < MAX_RETRIES) {
                console.log(`Service unavailable, retrying in ${RETRY_DELAY_MS * attempt / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt)); // Exponential backoff
            } else if ((e as Error).name === 'AbortError') {
                return { success: false, error: 'Scan was cancelled by the user.' };
            }
            else {
                break;
            }
        }
    }
    
    console.error("All retry attempts failed for scanning transfer proof.");
    return { success: false, error: `After ${MAX_RETRIES} attempts, the service is still unavailable. Please try again later. Last error: ${lastError}` };
}

export async function getRawTextFromImage(formData: FormData): Promise<{success: boolean, text?: string, error?: string}> {
    try {
        const imageFile = formData.get("imageFile") as File | null;
        if (!imageFile) {
            return { success: false, error: "No image file found in form data." };
        }
        
        const { extractRawText } = await import('@/ai/flows/extract-raw-text-flow');
        const arrayBuffer = await imageFile.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = imageFile.type;
        const dataUri = `data:${mimeType};base64,${base64}`;
        const result = await extractRawText({ photoDataUri: dataUri });
        return { success: true, text: result.rawText };
    } catch (e) {
        const error = e instanceof Error ? e.message : "Failed to extract text from image.";
        return { success: false, error };
    }
}
