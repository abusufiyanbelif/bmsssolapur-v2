

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
import type { Donation, DonationStatus, DonationType, DonationPurpose, User } from './types';

// Re-export types for backward compatibility if other services import from here
export type { Donation, DonationStatus, DonationType, DonationPurpose };

const DONATIONS_COLLECTION = 'donations';

// Function to create a donation
export const createDonation = async (
    donation: Omit<Donation, 'id' | 'createdAt'>, 
    adminUserId: string,
    adminUserName: string,
    adminUserEmail: string | undefined,
) => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    const donationRef = doc(collection(db, DONATIONS_COLLECTION));
    const newDonation: Donation = {
        ...donation,
        id: donationRef.id,
        createdAt: Timestamp.now()
    };
    await setDoc(donationRef, newDonation);
    
    await logActivity({
        userId: adminUserId,
        userName: adminUserName,
        userEmail: adminUserEmail,
        role: 'Admin', // Assuming only admins can create donations this way
        activity: 'Donation Created',
        details: { 
            donationId: newDonation.id!,
            donorName: newDonation.donorName,
            amount: newDonation.amount,
            linkedLeadId: newDonation.leadId,
            linkedCampaignId: newDonation.campaignId,
        },
    });

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
export const updateDonation = async (
    id: string, 
    updates: Partial<Donation>, 
    adminUser?: Pick<User, 'id' | 'name' | 'email'>
) => {
    if (!isConfigValid) throw new Error('Firebase is not configured.');
    try {
        const donationRef = doc(db, DONATIONS_COLLECTION, id);
        
        if (adminUser) {
            const originalDonation = await getDonation(id);
            await updateDoc(donationRef, updates);

            if(originalDonation) {
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
        } else {
            // If no admin user is provided, just perform the update without logging.
            // Useful for simple, non-audited actions like adding a proof URL.
             await updateDoc(donationRef, updates);
        }

    } catch (error) {
        console.error("Error updating donation: ", error);
        throw new Error('Failed to update donation.');
    }
};

// Function to delete a donation
export const deleteDonation = async (id: string) => {
    if (!isConfigValid) throw new Error('Firebase is not configured.');
    try {
        await deleteDoc(doc(db, DONATIONS_COLLECTION, id));
    } catch (error) {
        console.error("Error deleting donation: ", error);
        throw new Error('Failed to delete donation.');
    }
}


// Function to get all donations
export const getAllDonations = async (): Promise<Donation[]> => {
    if (!isConfigValid) {
      console.warn("Firebase not configured. Returning empty array for donations.");
      return [];
    }
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
