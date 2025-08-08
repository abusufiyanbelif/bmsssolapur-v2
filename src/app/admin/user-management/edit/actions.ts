

"use server";

import { updateUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import type { User, UserRole } from "@/services/types";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateUser(
  userId: string,
  formData: FormData
): Promise<FormState> {
  const rawFormData = {
    firstName: formData.get("firstName") as string,
    middleName: formData.get("middleName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    roles: formData.getAll("roles") as UserRole[],
    isActive: formData.get("isActive") === 'on',
    isAnonymousAsBeneficiary: formData.get("isAnonymousAsBeneficiary") === 'on',
    isAnonymousAsDonor: formData.get("isAnonymousAsDonor") === 'on',
    gender: formData.get("gender") as 'Male' | 'Female' | 'Other',
    beneficiaryType: formData.get("beneficiaryType") as 'Adult' | 'Old Age' | 'Kid' | 'Family' | undefined,
    
    addressLine1: formData.get("addressLine1") as string | undefined,
    city: formData.get("city") as string | undefined,
    state: formData.get("state") as string | undefined,
    country: formData.get("country") as string | undefined,
    pincode: formData.get("pincode") as string | undefined,

    occupation: formData.get("occupation") as string | undefined,
    familyMembers: formData.get("familyMembers") ? parseInt(formData.get("familyMembers") as string, 10) : undefined,
    isWidow: formData.get("isWidow") === 'on',
    
    panNumber: formData.get("panNumber") as string | undefined,
    aadhaarNumber: formData.get("aadhaarNumber") as string | undefined,
    bankAccountNumber: formData.get("bankAccountNumber") as string | undefined,
    upiIds: formData.getAll("upiIds") as string[],
  };
  
  if (!rawFormData.firstName || !rawFormData.lastName || !rawFormData.phone || rawFormData.roles.length === 0) {
      return { success: false, error: "Missing required fields." };
  }
  
  try {
    const updates: Partial<User> = {
        name: `${rawFormData.firstName} ${rawFormData.middleName || ''} ${rawFormData.lastName}`.replace(/\s+/g, ' ').trim(),
        firstName: rawFormData.firstName,
        middleName: rawFormData.middleName,
        lastName: rawFormData.lastName,
        // Email cannot be changed
        phone: rawFormData.phone,
        roles: rawFormData.roles,
        isActive: rawFormData.isActive,
        isAnonymousAsBeneficiary: rawFormData.isAnonymousAsBeneficiary,
        isAnonymousAsDonor: rawFormData.isAnonymousAsDonor,
        gender: rawFormData.gender,
        beneficiaryType: rawFormData.beneficiaryType,
        
        address: {
            addressLine1: rawFormData.addressLine1 || '',
            city: rawFormData.city || 'Solapur',
            state: rawFormData.state || 'Maharashtra',
            country: rawFormData.country || 'India',
            pincode: rawFormData.pincode || '',
        },

        occupation: rawFormData.occupation || '',
        familyMembers: rawFormData.familyMembers || 0,
        isWidow: rawFormData.isWidow,

        panNumber: rawFormData.panNumber || '',
        aadhaarNumber: rawFormData.aadhaarNumber || '',
        bankAccountNumber: rawFormData.bankAccountNumber || '',
        upiIds: rawFormData.upiIds.filter(id => id.trim() !== ''),
    };

    await updateUser(userId, updates);
    
    revalidatePath("/admin/user-management");
    revalidatePath(`/admin/user-management/${userId}/edit`);
    revalidatePath("/admin/beneficiaries");
    revalidatePath("/admin/donors");


    return {
      success: true,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating user:", error);
    return {
      success: false,
      error: error,
    };
  }
}


export async function handleSetPassword(formData: FormData): Promise<FormState> {
  const userId = formData.get("userId") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!userId || !newPassword) {
    return { success: false, error: "User ID and new password are required." };
  }
   if (newPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  try {
    await updateUser(userId, { password: newPassword });
    return { success: true };
  } catch(e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error setting password:", error);
    return {
      success: false,
      error: error,
    };
  }
}
