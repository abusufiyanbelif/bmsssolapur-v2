
"use server";

import { createUser, User, UserRole } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import { Timestamp } from "firebase/firestore";

interface FormState {
    success: boolean;
    error?: string;
    user?: User;
}

export async function handleAddUser(
  formData: FormData
): Promise<FormState> {
  const rawFormData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    roles: formData.getAll("roles") as UserRole[],
    // Correctly interpret checkbox value: 'on' if checked, null if not.
    isActive: formData.get("isActive") === 'on',
    gender: formData.get("gender") as 'Male' | 'Female' | 'Other',
    address: formData.get("address") as string | undefined,
    panNumber: formData.get("panNumber") as string | undefined,
    aadhaarNumber: formData.get("aadhaarNumber") as string | undefined,
  };
  
  if (!rawFormData.name || !rawFormData.email || !rawFormData.phone || rawFormData.roles.length === 0) {
      return { success: false, error: "Missing required fields." };
  }
  
  try {
    const newUserData: Omit<User, 'id' | 'createdAt'> = {
        name: rawFormData.name,
        email: rawFormData.email,
        phone: rawFormData.phone,
        roles: rawFormData.roles,
        isActive: rawFormData.isActive,
        gender: rawFormData.gender,
        address: rawFormData.address || '',
        panNumber: rawFormData.panNumber || '',
        aadhaarNumber: rawFormData.aadhaarNumber || '',
        privileges: [],
        groups: [],
    };

    const newUser = await createUser({...newUserData, createdAt: Timestamp.now()});
    
    revalidatePath("/admin/user-management");

    return {
      success: true,
      user: newUser,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error creating user:", error);
    return {
      success: false,
      error: error,
    };
  }
}

