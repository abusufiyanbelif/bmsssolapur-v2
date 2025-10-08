
"use server";

import { updateUser, User } from "@/services/user-service";
import { revalidatePath } from "next/cache";

interface FormState {
    success: boolean;
    error?: string;
}

// Update this payload to reflect the fields available on the profile form
type UpdateProfilePayload = Pick<User, 
    'firstName' | 'middleName' | 'lastName' | 'phone' | 
    'gender' | 'occupation' | 'panNumber' | 'aadhaarNumber' | 'beneficiaryType' | 'isWidow' | 
    'upiIds' | 'bankAccountName' | 'bankAccountNumber' | 'bankIfscCode' | 'bankName'
> & {
    address: {
        addressLine1: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
    };
};


export async function handleUpdateProfile(
  userId: string,
  data: Partial<UpdateProfilePayload>
): Promise<FormState> {
  try {
    if (!userId) {
      return { success: false, error: "User is not authenticated." };
    }
    
    // We only allow updating a subset of fields from the profile page
    const updates: Partial<User> = { ...data };
    
    if (data.firstName || data.middleName || data.lastName) {
       updates.name = `${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}`.replace(/\s+/g, ' ').trim();
    }
    
    // Ensure arrays are handled correctly
    if (data.upiIds) {
      updates.upiIds = Array.isArray(data.upiIds) ? data.upiIds.filter(Boolean) : [];
    }
    
    await updateUser(userId, updates);
    
    revalidatePath("/profile/settings");

    return { success: true };

  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred while updating your profile.";
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: `Failed to update profile: ${error}`,
    };
  }
}
