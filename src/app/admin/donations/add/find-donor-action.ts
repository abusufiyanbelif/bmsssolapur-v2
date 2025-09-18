// src/app/admin/donations/add/find-donor-action.ts
'use server';

import { 
    getUserByUpiId, 
    getUserByPhone, 
    getUserByFullName 
} from "@/services/user-service";
import type { User } from "@/services/types";

interface DonorDetails {
    upiId?: string;
    phone?: string;
    name?: string;
}

/**
 * Searches for an existing donor in the database based on provided details,
 * following a specific priority order (UPI -> Phone -> Name).
 * @param details - The extracted details to search with.
 * @returns The found User object, or null if no match is found.
 */
export async function findDonorByDetails(details: DonorDetails): Promise<User | null> {
    try {
        // 1. Search by UPI ID
        if (details.upiId) {
            const userByUpi = await getUserByUpiId(details.upiId);
            if (userByUpi) {
                return userByUpi;
            }
        }

        // 2. Search by Phone Number
        if (details.phone) {
            const userByPhone = await getUserByPhone(details.phone);
            if (userByPhone) {
                return userByPhone;
            }
        }

        // 3. Search by Full Name (as a last resort)
        if (details.name) {
            const userByName = await getUserByFullName(details.name);
            if (userByName) {
                return userByName;
            }
        }

        return null;
    } catch (e) {
        console.error("Error finding donor by details:", e);
        // Do not throw an error, just return null so the UI can handle it gracefully.
        return null;
    }
}
