// src/app/admin/user-management/add/actions.ts

"use server";

import { createUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import type { User, UserRole, ExtractBeneficiaryDetailsOutput } from "@/services/types";
import { Timestamp, collection } from "firebase/firestore";
import { uploadFile } from "@/services/storage-service";
import { extractBeneficiaryDetails } from "@/ai/flows/extract-beneficiary-details-flow";

interface FormState {
    success: boolean;
    error?: string;
    user?: User;
}

export async function handleAddUser(
  formData: FormData
): Promise<FormState> {
  const rawFormData = {
      userId: formData.get("userId") as string | undefined,
      firstName: formData.get("firstName") as string,
      middleName: formData.get("middleName") as string,
      lastName: formData.get("lastName") as string,
      fatherName: formData.get("fatherName") as string | undefined,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      password: formData.get("password") as string | undefined,
      roles: formData.getAll("roles") as UserRole[],
      createProfile: formData.get("createProfile") === 'on',
      isAnonymousAsBeneficiary: formData.get("isAnonymousAsBeneficiary") === 'on',
      isAnonymousAsDonor: formData.get("isAnonymousAsDonor") === 'on',
      gender: formData.get("gender") as 'Male' | 'Female' | 'Other' | undefined,
      beneficiaryType: formData.get("beneficiaryType") as 'Adult' | 'Old Age' | 'Kid' | 'Family' | 'Widow' | undefined,
      
      addressLine1: formData.get("addressLine1") as string | undefined,
      city: formData.get("city") as string | undefined,
      state: formData.get("state") as string | undefined,
      country: formData.get("country") as string | undefined,
      pincode: formData.get("pincode") as string | undefined,

      occupation: formData.get("occupation") as string | undefined,
      fatherOccupation: formData.get("fatherOccupation") as string | undefined,
      motherOccupation: formData.get("motherOccupation") as string | undefined,
      earningMembers: formData.get("earningMembers") ? parseInt(formData.get("earningMembers") as string, 10) : undefined,
      totalFamilyIncome: formData.get("totalFamilyIncome") ? parseFloat(formData.get("totalFamilyIncome") as string) : undefined,

      familyMembers: formData.get("familyMembers") ? parseInt(formData.get("familyMembers") as string, 10) : undefined,
      isWidow: formData.get("isWidow") === 'on',

      panNumber: formData.get("panNumber") as string | undefined,
      aadhaarNumber: formData.get("aadhaarNumber") as string | undefined,
      bankAccountName: formData.get("bankAccountName") as string | undefined,
      bankName: formData.get("bankName") as string | undefined,
      bankAccountNumber: formData.get("bankAccountNumber") as string | undefined,
      bankIfscCode: formData.get("bankIfscCode") as string | undefined,
      upiPhoneNumbers: formData.getAll("upiPhoneNumbers") as string[],
      upiIds: formData.getAll("upiIds") as string[],
      
      aadhaarCard: formData.get("aadhaarCard") as File | null,
  };
  
  if (!rawFormData.firstName || !rawFormData.lastName || !rawFormData.phone || rawFormData.roles.length === 0) {
      return { success: false, error: "Missing required fields: First Name, Last Name, Phone, and Role." };
  }
  
  try {
    const createdUser = await createUser({
        ...rawFormData,
        name: `${rawFormData.firstName} ${rawFormData.middleName || ''} ${rawFormData.lastName}`.replace(/\s+/g, ' ').trim(),
        email: rawFormData.email || undefined,
        roles: rawFormData.roles,
        isActive: true,
        address: {
            addressLine1: rawFormData.addressLine1 || '',
            city: rawFormData.city || 'Solapur',
            state: rawFormData.state || 'Maharashtra',
            country: rawFormData.country || 'India',
            pincode: rawFormData.pincode || '',
        },
        familyMembers: rawFormData.familyMembers || 0,
        earningMembers: rawFormData.earningMembers || 0,
        totalFamilyIncome: rawFormData.totalFamilyIncome || 0,
        isWidow: rawFormData.isWidow,
        upiPhoneNumbers: rawFormData.upiPhoneNumbers?.filter(Boolean) || [],
        upiIds: rawFormData.upiIds.filter(id => id.trim() !== ''),
        privileges: [],
        groups: [],
    });
    
    revalidatePath("/admin/user-management");
    revalidatePath("/admin/beneficiaries");
    revalidatePath("/admin/donors");
    revalidatePath("/admin/referrals");


    return {
      success: true,
      user: createdUser,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error creating user:", error);

    let helpfulError = `Failed to create user: ${error}`;
    if (error.includes('already exists')) {
        helpfulError += ` One of the unique fields (like Phone or Email) is already taken by another user.`
    } else if (error.includes('UserKey')) {
        helpfulError += ` Possible fix: Go to the user's profile and ensure their 'User Key' field is populated, or contact a Super Admin.`
    } else if (error.includes('permission-denied') || error.includes(' Firestore ')){
        helpfulError += ` This is likely a database permission issue. Please refer to the TROUBLESHOOTING.md guide.`
    }
    
    return {
      success: false,
      error: helpfulError,
    };
  }
}

export async function handleExtractUserDetailsFromText(
    rawText: string,
    fieldsToFind?: (keyof ExtractBeneficiaryDetailsOutput)[]
): Promise<{ success: boolean; details?: ExtractBeneficiaryDetailsOutput; error?: string }> {
    try {
        const extractedDetails = await extractBeneficiaryDetails({ rawText, fieldsToFind });
        return { success: true, details: extractedDetails };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown AI error occurred.";
        console.error("Error extracting beneficiary details from text:", error);
        return { success: false, error };
    }
}
