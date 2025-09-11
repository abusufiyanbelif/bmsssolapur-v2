

"use server";

import { createUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import type { User, UserRole } from "@/services/types";
import { Timestamp } from "firebase/firestore";
import { uploadFile } from "@/services/storage-service";

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
      isAnonymousAsBeneficiary: formData.get("isAnonymousAsBeneficiary") === 'on',
      isAnonymousAsDonor: formData.get("isAnonymousAsDonor") === 'on',
      gender: formData.get("gender") as 'Male' | 'Female' | 'Other',
      beneficiaryType: formData.get("beneficiaryType") as 'Adult' | 'Old Age' | 'Kid' | 'Family' | 'Widow' | undefined,
      
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
      bankName: formData.get("bankName") as string | undefined,
      bankAccountNumber: formData.get("bankAccountNumber") as string | undefined,
      bankIfscCode: formData.get("bankIfscCode") as string | undefined,
      upiPhoneNumbers: formData.getAll("upiPhoneNumbers") as string[],
      upiIds: formData.getAll("upiIds") as string[],
      
      aadhaarCard: formData.get("aadhaarCard") as File | null,
      addressProof: formData.get("addressProof") as File | null,
      
      createProfile: formData.get("createProfile") === 'on',
  };
  
  if (!rawFormData.firstName || !rawFormData.lastName || !rawFormData.phone || rawFormData.roles.length === 0) {
      return { success: false, error: "Missing required fields: First Name, Last Name, Phone, and Role." };
  }
  
  try {
    const newUser = await createUser({
        name: `${rawFormData.firstName} ${rawFormData.middleName || ''} ${rawFormData.lastName}`.replace(/\s+/g, ' ').trim(),
        userId: rawFormData.userId,
        firstName: rawFormData.firstName,
        middleName: rawFormData.middleName,
        lastName: rawFormData.lastName,
        fatherName: rawFormData.fatherName,
        email: rawFormData.email || undefined,
        phone: rawFormData.phone,
        password: rawFormData.password,
        roles: rawFormData.roles,
        isActive: true,
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
        bankName: rawFormData.bankName || '',
        bankAccountNumber: rawFormData.bankAccountNumber || '',
        bankIfscCode: rawFormData.bankIfscCode || '',
        upiPhoneNumbers: rawFormData.upiPhoneNumbers?.filter(Boolean) || [],
        upiIds: rawFormData.upiIds.filter(id => id.trim() !== ''),
        privileges: [],
        groups: [],
    });
    
    // After user is created, upload files if they exist
    const docUpdates: Partial<User> = {};
    const uploadPath = `users/${newUser.userKey}/documents/`;

    if (rawFormData.aadhaarCard && rawFormData.aadhaarCard.size > 0) {
      docUpdates.aadhaarCardUrl = await uploadFile(rawFormData.aadhaarCard, uploadPath);
    }
    if (rawFormData.addressProof && rawFormData.addressProof.size > 0) {
      docUpdates.addressProofUrl = await uploadFile(rawFormData.addressProof, uploadPath);
    }

    if (Object.keys(docUpdates).length > 0) {
      await updateUser(newUser.id!, docUpdates);
      Object.assign(newUser, docUpdates);
    }
    
    revalidatePath("/admin/user-management");
    revalidatePath("/admin/beneficiaries");
    revalidatePath("/admin/donors");
    revalidatePath("/admin/referrals");


    return {
      success: true,
      user: newUser,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error creating user:", error);
    return {
      success: false,
      error: `Failed to create user: ${error}`,
    };
  }
}
