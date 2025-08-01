
"use server";

import { updateUser, User, UserRole } from "@/services/user-service";
import { revalidatePath } from "next/cache";

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
    gender: formData.get("gender") as 'Male' | 'Female' | 'Other',
    address: formData.get("address") as string | undefined,
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
        gender: rawFormData.gender,
        address: rawFormData.address || '',
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
