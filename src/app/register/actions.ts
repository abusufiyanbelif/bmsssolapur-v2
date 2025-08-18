

"use server";

import { getUserByEmail, getUserByPhone, createUser, User } from '@/services/user-service';
import { isConfigValid } from '@/services/firebase';
import { Timestamp } from 'firebase/firestore';

interface RegisterState {
    success: boolean;
    error?: string;
    user?: User;
}

export async function handleRegister(formData: FormData): Promise<RegisterState> {
  if (!isConfigValid) {
    return { success: false, error: "Firebase is not configured. Cannot process registration." };
  }

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const phone = formData.get("phone") as string;

  if (!firstName || !lastName || !phone || !password) {
    return { success: false, error: "First Name, Last Name, Phone, and Password are required." };
  }
   if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, error: "Please enter a valid email address." };
    }
  if (!/^[0-9]{10}$/.test(phone)) {
      return { success: false, error: "Please enter a valid 10-digit phone number." };
  }


  try {
    // Check if user already exists
    if (email) {
        const existingUserByEmail = await getUserByEmail(email);
        if (existingUserByEmail) {
        return { success: false, error: "A user with this email address already exists. Please login instead." };
        }
    }
     const existingPhone = await getUserByPhone(phone);
    if (existingPhone) {
      return { success: false, error: "A user with this phone number already exists. Please login instead." };
    }

    const newUser: Omit<User, 'id' | 'createdAt' | 'userKey'> = {
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      email: email || undefined,
      phone,
      password,
      roles: ["Donor"], // Default role for new registrations
      isActive: true, // New users are active by default
      gender: 'Other',
      bankAccountName: formData.get("bankAccountName") as string || undefined,
      bankAccountNumber: formData.get("bankAccountNumber") as string || undefined,
      bankIfscCode: formData.get("bankIfscCode") as string || undefined,
      upiPhone: formData.get("upiPhone") as string || undefined,
      upiIds: (formData.getAll("upiIds") as string[]).filter(id => id.trim() !== ''),
    };

    const createdUser = await createUser(newUser);

    return { success: true, user: createdUser };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown database error occurred during registration.";
    return { success: false, error };
  }
}
