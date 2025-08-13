

"use server";

import { createUser, getUserByEmail, getUserByPhone, getUserByUserId, getUserByPan, getUserByAadhaar, getUserByBankAccountNumber, getUserByUpiId } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import { Timestamp } from "firebase/firestore";
import type { User, UserRole } from "@/services/types";

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
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    roles: formData.getAll("roles") as UserRole[],
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
    bankAccountName: formData.get("bankAccountName") as string | undefined,
    bankAccountNumber: formData.get("bankAccountNumber") as string | undefined,
    bankIfscCode: formData.get("bankIfscCode") as string | undefined,
    upiPhone: formData.get("upiPhone") as string | undefined,
    upiIds: formData.getAll("upiIds") as string[],
    
    // The "Create Profile" checkbox is mainly for client-side validation,
    // but we can check it here as a safeguard.
    createProfile: formData.get("createProfile") === 'on',
  };
  
  if (!rawFormData.firstName || !rawFormData.lastName || !rawFormData.phone || rawFormData.roles.length === 0) {
      return { success: false, error: "Missing required fields: First Name, Last Name, Phone, and Role." };
  }
  
  try {
    const newUserData: Omit<User, 'id' | 'createdAt'> = {
        name: `${rawFormData.firstName} ${rawFormData.middleName || ''} ${rawFormData.lastName}`.replace(/\s+/g, ' ').trim(),
        userId: rawFormData.userId,
        firstName: rawFormData.firstName,
        middleName: rawFormData.middleName,
        lastName: rawFormData.lastName,
        email: rawFormData.email || undefined,
        phone: rawFormData.phone,
        roles: rawFormData.roles,
        isActive: true, // Default to active
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
        upiIds: rawFormData.upiIds.filter(id => id.trim() !== ''),
        privileges: [],
        groups: [],
    };

    const newUser = await createUser({...newUserData, createdAt: Timestamp.now()});
    
    revalidatePath("/admin/user-management");
    revalidatePath("/admin/beneficiaries");


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

interface AvailabilityResult {
    isAvailable: boolean;
    suggestions?: string[];
    existingUserName?: string;
}

export async function checkAvailability(field: string, value: string): Promise<AvailabilityResult> {
    if (!value) return { isAvailable: true };

    try {
        let existingUser: User | null = null;
        switch (field) {
            case 'userId':
                existingUser = await getUserByUserId(value);
                break;
            case 'email':
                existingUser = await getUserByEmail(value);
                break;
            case 'phone':
                existingUser = await getUserByPhone(value);
                break;
            case 'panNumber':
                existingUser = await getUserByPan(value);
                break;
            case 'aadhaarNumber':
                existingUser = await getUserByAadhaar(value);
                break;
            case 'bankAccountNumber':
                existingUser = await getUserByBankAccountNumber(value);
                break;
            case 'upiId':
                 existingUser = await getUserByUpiId(value);
                 break;
            default:
                return { isAvailable: true };
        }

        if (existingUser) {
            let suggestions: string[] = [];
            if (field === 'userId') {
                for (let i = 1; i <= 3; i++) {
                    const suggestionId = `${value}${i}`;
                    const isSuggestionTaken = await getUserByUserId(suggestionId);
                    if (!isSuggestionTaken) {
                        suggestions.push(suggestionId);
                    }
                }
            }
            return { isAvailable: false, suggestions, existingUserName: existingUser.name };
        }
        return { isAvailable: true };
    } catch(e) {
        console.error(`Error checking ${field} availability:`, e);
        return { isAvailable: false }; // Fail closed to prevent duplicates
    }
}
