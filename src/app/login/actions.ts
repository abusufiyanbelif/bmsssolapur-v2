
"use server";

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, isConfigValid } from '@/services/firebase';
import { User, getUserByPhone } from '@/services/user-service';
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
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;

    if (!phone || !password) {
        return { success: false, error: "Phone and password are required." };
    }
    
    // For this prototype, we'll use a simple password check.
    // In a real application, you would use Firebase Authentication
    // with password hashing or other secure methods.
    if (password !== 'admin') {
         return { success: false, error: "Invalid password." };
    }

    try {
        const user = await getUserByPhone(phone);

        if (!user) {
            return { success: false, error: "User with this phone number not found." };
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
        // Basic validation: Check if user exists before sending OTP
        const user = await getUserByPhone(phoneNumber); 
        if (!user) {
            return { success: false, error: "No user found with this phone number." };
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
