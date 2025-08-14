

"use server";

import { getUser, updateUser, User } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/services/types";
import { logActivity } from "@/services/activity-log-service";

interface FormState {
    success: boolean;
    error?: string;
}

// Helper function to find differences between two objects for logging
const getChangedFields = (original: User, updates: Partial<User>) => {
    const changes: Record<string, { from: any; to: any }> = {};
    for (const key in updates) {
        const typedKey = key as keyof User;
        
        // Handle nested address object
        if (typedKey === 'address' && typeof updates.address === 'object' && updates.address !== null) {
            for (const addressKey in updates.address) {
                const typedAddressKey = addressKey as keyof User['address'];
                if (original.address?.[typedAddressKey] !== updates.address?.[typedAddressKey]) {
                     changes[`address.${typedAddressKey}`] = { from: original.address?.[typedAddressKey] || 'N/A', to: updates.address?.[typedAddressKey] };
                }
            }
            continue;
        }

        // Handle array of strings like 'roles' or 'upiIds'
        if (Array.isArray(original[typedKey]) && Array.isArray(updates[typedKey])) {
            const fromStr = (original[typedKey] as any[]).join(', ') || '[]';
            const toStr = (updates[typedKey] as any[]).join(', ') || '[]';
            if (fromStr !== toStr) {
                changes[typedKey] = { from: fromStr, to: toStr };
            }
            continue;
        }

        if (original[typedKey] !== updates[typedKey]) {
             changes[typedKey] = { from: original[typedKey] || 'N/A', to: updates[typedKey] };
        }
    }
    return changes;
}

export async function handleUpdateUser(
  userId: string,
  rawFormData: any,
  adminUserId: string,
): Promise<FormState> {
  
  if (!rawFormData.firstName || !rawFormData.lastName || !rawFormData.phone || rawFormData.roles.length === 0) {
      return { success: false, error: "Missing required fields." };
  }
  
  try {
    const [originalUser, adminUser] = await Promise.all([
        getUser(userId),
        getUser(adminUserId),
    ]);
    if(!originalUser) return { success: false, error: "User to be updated not found." };
    if(!adminUser) return { success: false, error: "Admin performing the action not found." };

    let finalRoles = rawFormData.roles;

    // If the admin is NOT a Super Admin, we need to be careful about roles.
    if (!adminUser.roles.includes('Super Admin')) {
        const higherRoles = ['Admin', 'Super Admin', 'Finance Admin'];
        const existingHigherRoles = originalUser.roles.filter(role => higherRoles.includes(role));
        const submittedNormalRoles = rawFormData.roles.filter((role: UserRole) => !higherRoles.includes(role));
        // Merge the user's existing higher roles with the normal roles submitted by the non-super-admin.
        finalRoles = [...new Set([...existingHigherRoles, ...submittedNormalRoles])];
    }

    const updates: Partial<User> = {
        name: `${rawFormData.firstName} ${rawFormData.middleName || ''} ${rawFormData.lastName}`.replace(/\s+/g, ' ').trim(),
        firstName: rawFormData.firstName,
        middleName: rawFormData.middleName,
        lastName: rawFormData.lastName,
        phone: rawFormData.phone,
        roles: finalRoles,
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
        bankAccountName: rawFormData.bankAccountName || '',
        bankAccountNumber: rawFormData.bankAccountNumber || '',
        bankIfscCode: rawFormData.bankIfscCode || '',
        upiPhone: rawFormData.upiPhone || '',
        upiIds: (rawFormData.upiIds || []).map((item: { value: string }) => item.value).filter(Boolean),
    };
    
    const changes = getChangedFields(originalUser, updates);
    
    await updateUser(userId, updates);
    
    if (Object.keys(changes).length > 0) {
        await logActivity({
            userId: adminUserId,
            userName: adminUser.name,
            userEmail: adminUser.email,
            role: "Super Admin", // Or a more dynamic role
            activity: "User Profile Updated",
            details: {
                targetUserId: userId,
                targetUserName: originalUser.name,
                changes: changes
            }
        });
    }

    revalidatePath("/admin/user-management");
    revalidatePath(`/admin/user-management/${userId}/edit`);
    revalidatePath("/admin/beneficiaries");
    revalidatePath("/admin/donors");
    revalidatePath("/admin/referrals");


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
