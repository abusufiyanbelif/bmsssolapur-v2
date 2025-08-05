

"use server";

import { updateUser, User } from "@/services/user-service";
import { revalidatePath } from "next/cache";

interface FormState {
    success: boolean;
    error?: string;
}

type UpdateProfilePayload = Pick<User, 'firstName' | 'middleName' | 'lastName' | 'phone' | 'gender' | 'occupation' | 'panNumber' | 'aadhaarNumber' | 'beneficiaryType' | 'enableMonthlyDonationReminder'> & {
    address: {
        addressLine1: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
    };
    familyMembers: number;
    isWidow: boolean;
};


export async function handleUpdateProfile(
  userId: string,
  data: UpdateProfilePayload
): Promise<FormState> {
  try {
    if (!userId) {
      return { success: false, error: "User is not authenticated." };
    }
    
    // We only allow updating a subset of fields from the profile page
    const updates: Partial<User> = {
      name: `${data.firstName} ${data.middleName || ''} ${data.lastName}`.replace(/\s+/g, ' ').trim(),
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address,
      gender: data.gender,
      beneficiaryType: data.beneficiaryType,
      occupation: data.occupation,
      familyMembers: data.familyMembers,
      isWidow: data.isWidow,
      panNumber: data.panNumber,
      aadhaarNumber: data.aadhaarNumber,
    };
    
    await updateUser(userId, updates);
    
    revalidatePath("/profile");

    return { success: true };

  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: error,
    };
  }
}
