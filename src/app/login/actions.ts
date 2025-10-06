

'use server';

import { collection, query, where, getDocs, Timestamp, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { User, getUserByPhone, getUserByEmail, getUser, getUserByUserId, updateUser, createUser } from '@/services/user-service';
import { sendOtp } from '@/ai/flows/send-otp-flow';
import { verifyOtp } from '@/ai/flows/verify-otp-flow';
import { logActivity } from '@/services/activity-log-service';
import { getAppSettings } from '@/services/app-settings-service';

interface LoginState {
    success: boolean;
    error?: string;
    userId?: string;
    redirectTo?: string;
}

export async function handleLogin(formData: FormData): Promise<LoginState> {
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;

    if (!identifier || !password) {
        return { success: false, error: "Identifier and password are required." };
    }

    try {
        let user: User | null = null;
        
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        const isPhone = /^[0-9]{10}$/.test(identifier);

        if (isEmail) {
            user = await getUserByEmail(identifier);
        } else if (isPhone) {
            user = await getUserByPhone(identifier);
        } else {
            // If not an email or phone, assume it's a User ID
            user = await getUserByUserId(identifier);
        }
        
        if (!user) {
            return { success: false, error: "User not found. Please check your User ID, email, or phone number." };
        }

        // Check if the account is active. Super Admins can always log in.
        if (!user.isActive && !user.roles.includes('Super Admin')) {
            return { success: false, error: "This user account is inactive. Please contact an administrator." };
        }

        // Check the stored password.
        if (password !== user.password) {
            return { success: false, error: "Incorrect password. Please try again." };
        }
        
        const primaryRole = user.roles[0];
        let redirectTo = '/home'; // Default fallback
        if (primaryRole === 'Donor') redirectTo = '/donor';
        if (primaryRole === 'Beneficiary') redirectTo = '/beneficiary';
        if (primaryRole === 'Referral') redirectTo = '/referral';
        if (['Admin', 'Super Admin', 'Finance Admin'].includes(primaryRole)) redirectTo = '/admin';

        await logActivity({
            userId: user.id!,
            userName: user.name,
            userEmail: user.email,
            role: primaryRole,
            activity: 'User Logged In',
            details: { method: 'password' },
        });

        return { success: true, userId: user.id, redirectTo };

    } catch (e) {
        console.error("Login error:", e);
        const error = e instanceof Error ? e.message : "An unknown database error occurred.";
        return { success: false, error };
    }
}

interface OtpState {
    success: boolean;
    provider?: 'firebase' | 'twilio';
    error?: string;
}

export async function handleSendOtp(phoneNumber: string): Promise<OtpState> {
    try {
        const user = await getUserByPhone(phoneNumber);
        if (!user) {
            return { success: false, error: "No user found with this phone number. Please register first or try a different number." };
        }

        if (!user.isActive && !user.roles.includes('Super Admin')) {
            return { success: false, error: "This user account is inactive. Please contact an administrator." };
        }

        const settings = await getAppSettings();
        const otpProvider = settings?.notificationSettings?.sms.provider || 'firebase';

        if (otpProvider === 'firebase') {
            // For Firebase, we just confirm the user exists and tell the client to proceed.
            // The actual OTP sending is handled by the client-side Firebase SDK.
            return { success: true, provider: 'firebase' };
        } else {
            // For Twilio, we send the OTP from the server.
            const fullPhoneNumber = `+91${phoneNumber}`;
            const result = await sendOtp({ phoneNumber: fullPhoneNumber });
            if (result.success) {
                return { success: true, provider: 'twilio' };
            } else {
                return { success: false, error: result.error, provider: 'twilio' };
            }
        }
    } catch(e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        return { success: false, error };
    }
}


export async function handleVerifyOtp(formData: FormData): Promise<LoginState> {
    const phoneNumber = formData.get("phone") as string;
    const code = formData.get("otp") as string;
    
    if (!phoneNumber || !code) {
        return { success: false, error: "Phone and OTP code are required." };
    }

    try {
        // Find user by the plain 10-digit phone number first
        const user = await getUserByPhone(phoneNumber); 
        if (!user) {
             return { success: false, error: "User with this phone number not found." };
        }
        
        // This server action is now only for Twilio verification.
        // Firebase verification is handled client-side.
        const fullPhoneNumber = `+91${phoneNumber}`;
        const verificationResult = await verifyOtp({ phoneNumber: fullPhoneNumber, code });
        
        if (!verificationResult.success) {
            return { success: false, error: verificationResult.error || "Invalid OTP code. Please try again." };
        }
        
        const primaryRole = user.roles[0];
        let redirectTo = '/home'; // Default fallback
        if (primaryRole === 'Donor') redirectTo = '/donor';
        if (primaryRole === 'Beneficiary') redirectTo = '/beneficiary';
        if (primaryRole === 'Referral') redirectTo = '/referral';
        if (['Admin', 'Super Admin', 'Finance Admin'].includes(primaryRole)) redirectTo = '/admin';

        await logActivity({
            userId: user.id!,
            userName: user.name,
            userEmail: user.email,
            role: primaryRole,
            activity: 'User Logged In',
            details: { method: 'otp' },
        });

        return { success: true, userId: user.id!, redirectTo };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        return { success: false, error };
    }
}

interface OAuthLoginState {
    success: boolean;
    error?: string;
    userId?: string;
}

export async function handleGoogleLogin(firebaseUser: {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
}): Promise<OAuthLoginState> {
  if (!firebaseUser.email) {
    return { success: false, error: 'Google account must have an email.' };
  }

  try {
    const { createUser } = await import('@/services/user-service');
    let appUser = await getUserByEmail(firebaseUser.email);
    let isNewUser = false;

    if (!appUser) {
      isNewUser = true;
      // User doesn't exist, create a new one
      const newUser: Omit<User, 'id'> = {
        name: firebaseUser.displayName || 'Google User',
        email: firebaseUser.email,
        password: `google_${Date.now()}`, // Set a random, unusable password for OAuth users
        // Use a placeholder phone number; the user can update it in their profile
        phone: Date.now().toString().slice(-10),
        roles: ['Donor'], // Default role for new sign-ups
        isActive: true, // New users are active by default
        createdAt: Timestamp.now(),
        gender: 'Other',
        address: {
            addressLine1: '',
            city: 'Solapur',
            state: 'Maharashtra',
            country: 'India',
            pincode: '',
        },
        panNumber: '',
        aadhaarNumber: '',
        privileges: [],
        groups: []
      };
      // Use the Firebase UID as the document ID for our user record
      appUser = await createUser({ ...newUser, id: firebaseUser.uid });
    } else if (!appUser.isActive && !appUser.roles.includes('Super Admin')) {
        return { success: false, error: 'This user account is inactive. Please contact an administrator.' };
    }

    await logActivity({
        userId: appUser.id!,
        userName: appUser.name,
        userEmail: appUser.email,
        role: appUser.roles[0],
        activity: 'User Logged In',
        details: { method: 'google-oauth', isNewUser: isNewUser },
    });

    return { success: true, userId: appUser.id };
  } catch (e) {
    console.error('Error during Google login process:', e);
    const error = e instanceof Error ? e.message : 'An unknown error occurred during login.';
    return { success: false, error };
  }
}

export async function handleFirebaseOtpLogin(uid: string, phoneNumber: string | null): Promise<LoginState> {
    try {
        let user: User | null = await getUser(uid);
        
        // If user not found by UID, this is likely a first-time OTP login for a pre-existing user.
        // We need to find their profile by phone number and migrate their document ID to match the Firebase UID.
        if (!user && phoneNumber) {
            const phone = phoneNumber.replace('+91', '');
            const existingUserByPhone = await getUserByPhone(phone);
            
            if (existingUserByPhone && existingUserByPhone.id) {
                // Found the user by phone. Now, we perform a migration.
                const batch = writeBatch(db);
                
                // 1. Create a new document with the Firebase UID as the ID
                const newUserRef = doc(db, 'users', uid);
                const oldUserData = { ...existingUserByPhone };
                delete (oldUserData as any).id; // Don't copy the old ID field
                batch.set(newUserRef, oldUserData);
                
                // 2. Delete the old document that was referenced by phone number
                const oldUserRef = doc(db, 'users', existingUserByPhone.id);
                batch.delete(oldUserRef);
                
                await batch.commit();

                // 3. Set the 'user' variable to the newly created user data
                user = { ...oldUserData, id: uid } as User;
                
                console.log(`Successfully migrated user from old ID ${existingUserByPhone.id} to new Firebase UID ${uid}.`);
            }
        }
        
        if (!user) {
             return { success: false, error: 'Could not retrieve user data after sign-in. Your phone number might not be registered in our system.' };
        }
        
        await logActivity({
            userId: user.id!,
            userName: user.name,
            userEmail: user.email,
            role: user.roles[0],
            activity: 'User Logged In',
            details: { method: 'otp (firebase)' },
        });

        const primaryRole = user.roles[0];
        let redirectTo = '/home'; // Default fallback
        if (primaryRole === 'Donor') redirectTo = '/donor';
        if (primaryRole === 'Beneficiary') redirectTo = '/beneficiary';
        if (primaryRole === 'Referral') redirectTo = '/referral';
        if (['Admin', 'Super Admin', 'Finance Admin'].includes(primaryRole)) redirectTo = '/admin';

        return { success: true, userId: user.id!, redirectTo: redirectTo };

    } catch (e) {
        console.error("Firebase OTP Login Finalization Error:", e);
        const error = e instanceof Error ? e.message : "An unknown database error occurred.";
        return { success: false, error };
    }
}
