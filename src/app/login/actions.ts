
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
}

export async function handleLogin(formData: FormData): Promise<LoginState> {
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;

    if (!identifier || !password) {
        return { success: false, error: "User ID and password are required." };
    }

    try {
        let user: User | null = null;
        
        // Robust user lookup: Check by email, then phone, then custom userId.
        if (identifier.includes('@')) {
             user = await getUserByEmail(identifier);
        } else if (/^[0-9]{10}$/.test(identifier)) {
             user = await getUserByPhone(identifier);
        } else {
            user = await getUserByUserId(identifier);
        }
        
        if (!user) {
            return { success: false, error: "User not found. Please check your credentials." };
        }
        
        // Special case for the 'admin' user with a hardcoded password check
        if (user.userId === 'admin' && user.id === 'ADMIN_USER_ID') {
            if (password !== user.password) {
                 return { success: false, error: "Incorrect password. Please try again." };
            }
        } else {
             if (password !== user.password) {
                return { success: false, error: "Incorrect password. Please try again." };
            }
        }


        if (!user.isActive && !user.roles.includes('Super Admin')) {
            return { success: false, error: "This user account is inactive. Please contact an administrator." };
        }
        
        await logActivity({
            userId: user.id!,
            userName: user.name,
            userEmail: user.email,
            role: user.roles[0],
            activity: 'User Logged In',
            details: { method: 'password' },
        });

        // The client will handle the redirect.
        return { success: true, userId: user.id };

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
            return { success: true, provider: 'firebase' };
        } else {
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
        const user = await getUserByPhone(phoneNumber); 
        if (!user) {
             return { success: false, error: "User with this phone number not found." };
        }
        
        const fullPhoneNumber = `+91${phoneNumber}`;
        const verificationResult = await verifyOtp({ phoneNumber: fullPhoneNumber, code });
        
        if (!verificationResult.success) {
            return { success: false, error: verificationResult.error || "Invalid OTP code. Please try again." };
        }
        
        await logActivity({
            userId: user.id!,
            userName: user.name,
            userEmail: user.email,
            role: user.roles[0],
            activity: 'User Logged In',
            details: { method: 'otp' },
        });

        // Return userId for the client to handle session and redirection.
        return { success: true, userId: user.id! };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        return { success: false, error };
    }
}


export async function handleFirebaseOtpLogin(uid: string, phoneNumber: string | null): Promise<LoginState> {
    try {
        let user: User | null = await getUser(uid);
        
        // Handle case where Firebase creates a new UID for an existing phone number
        if (!user && phoneNumber) {
            const phone = phoneNumber.replace('+91', '');
            const existingUserByPhone = await getUserByPhone(phone);
            
            if (existingUserByPhone && existingUserByPhone.id) {
                console.warn(`Potential user migration needed. Firebase UID: ${uid}, existing user ID: ${existingUserByPhone.id} for phone: ${phone}`);
                user = existingUserByPhone;
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

        // Return userId for the client to handle session and redirection.
        return { success: true, userId: user.id! };

    } catch (e) {
        console.error("Firebase OTP Login Finalization Error:", e);
        const error = e instanceof Error ? e.message : "An unknown database error occurred.";
        return { success: false, error };
    }
}
