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
} from 'firebase/firestore';
import { db } from './firebase';
import { logDonationActivity } from './donation-activity-log';

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
export const createDonation = async (donation: Omit<Donation, 'id' | 'createdAt'>, performedBy?: string) => {
  try {
    const donationRef = doc(collection(db, DONATIONS_COLLECTION));
    const newDonation: Donation = {
        ...donation,
        id: donationRef.id,
        createdAt: Timestamp.now()
    };
    await setDoc(donationRef, newDonation);
    await logDonationActivity(newDonation.id!, 'Donation Created', { details: `Donation of ${newDonation.amount} from ${newDonation.donorName} created.` }, performedBy);
    return newDonation;
  } catch (error) {
    console.error('Error creating donation: ', error);
    throw new Error('Failed to create donation.');
  }
};

// Function to get a donation by ID
export const getDonation = async (id: string) => {
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
export const updateDonation = async (id: string, updates: Partial<Donation>, performedBy?: string) => {
    try {
        const donationRef = doc(db, DONATIONS_COLLECTION, id);
        const originalDonation = await getDonation(id);

        await updateDoc(donationRef, updates);

        if(updates.status && originalDonation?.status !== updates.status) {
            await logDonationActivity(id, 'Status Changed', { from: originalDonation?.status, to: updates.status }, performedBy);
        } else {
             await logDonationActivity(id, 'Donation Updated', { updates: Object.keys(updates).join(', ') }, performedBy);
        }

    } catch (error) {
        console.error("Error updating donation: ", error);
        throw new Error('Failed to update donation.');
    }
};

// Function to get all donations
export const getAllDonations = async (): Promise<Donation[]> => {
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
