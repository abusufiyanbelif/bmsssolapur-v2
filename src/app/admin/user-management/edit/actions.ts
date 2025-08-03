
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
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    roles: formData.getAll("roles") as UserRole[],
    isActive: formData.get("isActive") === 'on',
    isAnonymous: formData.get("isAnonymous") === 'on',
    gender: formData.get("gender") as 'Male' | 'Female' | 'Other',
    
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
  };
  
  if (!rawFormData.name || !rawFormData.phone || rawFormData.roles.length === 0) {
      return { success: false, error: "Missing required fields." };
  }
  
  try {
    const updates: Partial<User> = {
        name: rawFormData.name,
        // Email cannot be changed
        phone: rawFormData.phone,
        roles: rawFormData.roles,
        isActive: rawFormData.isActive,
        isAnonymous: rawFormData.isAnonymous,
        gender: rawFormData.gender,
        
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
    };

    await updateUser(userId, updates);
    
    revalidatePath("/admin/user-management");
    revalidatePath(`/admin/user-management/${userId}/edit`);
    revalidatePath("/admin/beneficiaries");


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
