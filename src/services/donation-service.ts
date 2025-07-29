
/**
 * @fileOverview Donation service for interacting with Firestore.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  getDocs,
  Timestamp,
  where,
  orderBy
} from 'firebase/firestore';
import { db, isConfigValid } from './firebase';
import { logActivity } from './activity-log-service';
import { getUser } from './user-service';

const DONATIONS_COLLECTION = 'donations';

export type DonationStatus = 'Pending verification' | 'Verified' | 'Failed/Incomplete' | 'Allocated';
export type DonationType = 'Zakat' | 'Sadaqah' | 'Fitr' | 'Lillah' | 'Kaffarah' | 'Split';
export type DonationPurpose = 'Education' | 'Deen' | 'Hospital' | 'Loan and Relief Fund' | 'To Organization Use' | 'Loan Repayment';

export interface Allocation {
  leadId: string;
  amount: number;
  allocatedAt: Timestamp;
}

export interface Donation {
  id?: string;
  donorId: string; // Should link to a User ID
  donorName: string;
  amount: number;
  type: DonationType;
  purpose?: DonationPurpose;
  status: DonationStatus;
  isAnonymous?: boolean; // To handle anonymous donations
  paymentScreenshotUrl?: string; // URL to the uploaded screenshot
  transactionId?: string;
  createdAt: Timestamp;
  verifiedAt?: Timestamp;
  // allocations will store an array of mappings to leads
  allocations?: Allocation[];
  notes?: string;
}

// Function to create a donation
export const createDonation = async (donation: Omit<Donation, 'id' | 'createdAt'>, adminUserId: string) => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    const adminUser = await getUser(adminUserId);
    const donationRef = doc(collection(db, DONATIONS_COLLECTION));
    const newDonation: Donation = {
        ...donation,
        id: donationRef.id,
        createdAt: Timestamp.now()
    };
    await setDoc(donationRef, newDonation);
    
    if (adminUser) {
        await logActivity({
            userId: adminUser.id!,
            userName: adminUser.name,
            userEmail: adminUser.email,
            role: 'Admin', // Assuming only admins can create donations this way
            activity: 'Donation Created',
            details: { 
                donationId: newDonation.id!,
                donorName: newDonation.donorName,
                amount: newDonation.amount
            },
        });
    }

    return newDonation;
  } catch (error) {
    console.error('Error creating donation: ', error);
    throw new Error('Failed to create donation.');
  }
};

// Function to get a donation by ID
export const getDonation = async (id: string) => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    const donationDoc = await getDoc(doc(db, DONATIONS_COLLECTION, id));
    if (donationDoc.exists()) {
      return { id: donationDoc.id, ...donationDoc.data() } as Donation;
    }
    return null;
  } catch (error) {
    console.error('Error getting donation: ', error);
    throw new Error('Failed to get donation.');
  }
};

// Function to update a donation
export const updateDonation = async (id: string, updates: Partial<Donation>, performedByUserId: string) => {
    if (!isConfigValid) throw new Error('Firebase is not configured.');
    try {
        const adminUser = await getUser(performedByUserId);
        const donationRef = doc(db, DONATIONS_COLLECTION, id);
        const originalDonation = await getDonation(id);

        await updateDoc(donationRef, updates);

        if(adminUser && originalDonation) {
            if(updates.status && originalDonation.status !== updates.status) {
                await logActivity({
                    userId: adminUser.id!,
                    userName: adminUser.name,
                    userEmail: adminUser.email,
                    role: 'Admin',
                    activity: 'Status Changed',
                    details: { 
                        donationId: id,
                        from: originalDonation.status,
                        to: updates.status
                    }
                });
            } else {
                 await logActivity({
                    userId: adminUser.id!,
                    userName: adminUser.name,
                    userEmail: adminUser.email,
                    role: 'Admin',
                    activity: 'Donation Updated',
                    details: { 
                        donationId: id,
                        updates: Object.keys(updates).join(', ')
                    }
                 });
            }
        }

    } catch (error) {
        console.error("Error updating donation: ", error);
        throw new Error('Failed to update donation.');
    }
};

// Function to get all donations
export const getAllDonations = async (): Promise<Donation[]> => {
    if (!isConfigValid) return [];
    try {
        const donationsQuery = query(collection(db, DONATIONS_COLLECTION));
        const querySnapshot = await getDocs(donationsQuery);
        const donations: Donation[] = [];
        querySnapshot.forEach((doc) => {
            donations.push({ id: doc.id, ...doc.data() } as Donation);
        });
        return donations;
    } catch (error) {
        console.error("Error getting all donations: ", error);
        throw new Error('Failed to get all donations.');
    }
}

// Function to get all donations for a specific user
export const getDonationsByUserId = async (userId: string): Promise<Donation[]> => {
    if (!isConfigValid) return [];
    try {
        const donationsQuery = query(
            collection(db, DONATIONS_COLLECTION), 
            where("donorId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(donationsQuery);
        const donations: Donation[] = [];
        querySnapshot.forEach((doc) => {
            donations.push({ id: doc.id, ...doc.data() } as Donation);
        });
        return donations;
    } catch (error) {
        console.error("Error getting user donations: ", error);
        // This could be due to a missing index. Log a helpful message.
        if (error instanceof Error && error.message.includes('index')) {
             console.error("Firestore index missing. Please create a composite index in Firestore on the 'donations' collection for 'donorId' (ascending) and 'createdAt' (descending).");
        }
        throw new Error('Failed to get user donations.');
    }
}

    