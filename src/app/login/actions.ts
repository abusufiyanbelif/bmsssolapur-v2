
"use server";

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { User } from '@/services/user-service';

interface LoginState {
    success: boolean;
    error?: string;
    userId?: string;
}

export async function handleLogin(formData: FormData): Promise<LoginState> {
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
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("phone", "==", phone));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, error: "User with this phone number not found." };
        }

        // Assuming phone numbers are unique, so we take the first result.
        const userDoc = querySnapshot.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() } as User;
        
        return { success: true, userId: user.id };

    } catch (e) {
        console.error("Login error:", e);
        const error = e instanceof Error ? e.message : "An unknown database error occurred.";
        return { success: false, error };
    }
}

    