
"use server";

import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db, isConfigValid } from '@/services/firebase';
import { User, getUserByPhone, getUserByEmail, createUser, getUserByName } from '@/services/user-service';
import { sendOtp } from '@/ai/flows/send-otp-flow';
import { verifyOtp } from '@/ai/flows/verify-otp-flow';

interface LoginState {
    success: boolean;
    error?: string;
    userId?: string;
}

export async function handleLogin(formData: FormData): Promise<LoginState> {
    if (!isConfigValid) {
        return { success: false, error: "Firebase is not configured. Cannot process login." };
    }
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;
    const loginMethod = formData.get("loginMethod") as 'username' | 'email' | 'phone';

    if (!identifier || !password || !loginMethod) {
        return { success: false, error: "Identifier, password, and login method are required." };
    }

    // For this prototype, we'll use a simple password check for all users.
    // In a real application, you would use Firebase Authentication
    // with password hashing or other secure methods.
    if (password !== 'admin') {
         return { success: false, error: "Invalid credentials." };
    }

    try {
        let user: User | null = null;
        
        switch (loginMethod) {
            case 'email':
                const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
                if (!isEmail) {
                    return { success: false, error: "Please enter a valid email address." };
                }
                user = await getUserByEmail(identifier);
                break;
            case 'phone':
                const phoneRegex = /^[0-9]{10}$/;
                if (!phoneRegex.test(identifier)) {
                    return { success: false, error: "Please enter a valid 10-digit phone number." };
                }
                user = await getUserByPhone(identifier);
                break;
            case 'username':
                user = await getUserByName(identifier);
                break;
            default:
                return { success: false, error: "Invalid login method specified." };
        }
        
        if (!user) {
            return { success: false, error: "User not found with the provided details." };
        }

        if (!user.isActive) {
            return { success: false, error: "This user account is inactive. Please contact an administrator." };
        }
        
        return { success: true, userId: user.id };

    } catch (e) {
        console.error("Login error:", e);
        const error = e instanceof Error ? e.message : "An unknown database error occurred.";
        return { success: false, error };
    }
}

interface OtpState {
    success: boolean;
    error?: string;
}

export async function handleSendOtp(phoneNumber: string): Promise<OtpState> {
    if (!isConfigValid) {
        return { success: false, error: "Firebase is not configured. Cannot send OTP." };
    }
    
    try {
        // Basic validation: Check if user exists with the 10-digit number before sending OTP
        const user = await getUserByPhone(phoneNumber); 
        if (!user) {
            return { success: false, error: "No user found with this phone number." };
        }
         if (!user.isActive) {
            return { success: false, error: "This user account is inactive. Please contact an administrator." };
        }
        
        // Add country code only when sending to the external service
        const fullPhoneNumber = `+91${phoneNumber}`;
        const result = await sendOtp({ phoneNumber: fullPhoneNumber });
        return result;
    } catch(e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        return { success: false, error };
    }
}


export async function handleVerifyOtp(formData: FormData): Promise<LoginState> {
    if (!isConfigValid) {
        return { success: false, error: "Firebase is not configured. Cannot verify OTP." };
    }
    const phoneNumber = formData.get("phone") as string;
    const code = formData.get("otp") as string;
    
    if (!phoneNumber || !code) {
        return { success: false, error: "Phone and OTP code are required." };
    }

    try {
        // Add country code only when verifying with the external service
        const fullPhoneNumber = `+91${phoneNumber}`;
        const verificationResult = await verifyOtp({ phoneNumber: fullPhoneNumber, code });
        
        if (!verificationResult.success) {
            return { success: false, error: verificationResult.error || "Invalid OTP." };
        }
        
        // Find user by the plain 10-digit phone number
        const user = await getUserByPhone(phoneNumber); 
        if (!user) {
             return { success: false, error: "User with this phone number not found." };
        }

        return { success: true, userId: user.id! };

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
  if (!isConfigValid) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  if (!firebaseUser.email) {
    return { success: false, error: 'Google account must have an email.' };
  }

  try {
    let appUser = await getUserByEmail(firebaseUser.email);

    if (!appUser) {
      // User doesn't exist, create a new one
      const newUser: Omit<User, 'id'> = {
        name: firebaseUser.displayName || 'Google User',
        email: firebaseUser.email,
        // Use a placeholder phone number; the user can update it in their profile
        phone: Date.now().toString().slice(-10),
        roles: ['Donor'], // Default role for new sign-ups
        isActive: true, // New users are active by default
        createdAt: Timestamp.now(),
        gender: 'Other',
        address: '',
        panNumber: '',
        aadhaarNumber: '',
        privileges: [],
        groups: []
      };
      // Use the Firebase UID as the document ID for our user record
      appUser = await createUser({ ...newUser, id: firebaseUser.uid });
    }

    return { success: true, userId: appUser.id };
  } catch (e) {
    console.error('Error during Google login process:', e);
    const error = e instanceof Error ? e.message : 'An unknown error occurred during login.';
    return { success: false, error };
  }
}

