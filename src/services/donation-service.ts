
// src/services/donation-service.ts
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
  orderBy,
  getCountFromServer,
  writeBatch,
  increment,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import { db, isConfigValid } from './firebase';
import { logActivity } from './activity-log-service';
import type { Donation, DonationStatus, DonationType, DonationPurpose, User, LeadDonationAllocation, Lead, Allocation } from './types';
import { getUser } from './user-service';
import { format } from 'date-fns';

// Re-export types for backward compatibility if other services import from here
export type { Donation, DonationStatus, DonationType, DonationPurpose };
export { getUser };

const DONATIONS_COLLECTION = 'donations';
const LEADS_COLLECTION = 'leads';

// Function to create a donation
export const createDonation = async (
    donation: Omit<Donation, 'id' | 'createdAt'>, 
    adminUserId: string,
    adminUserName: string,
    adminUserEmail: string | undefined,
) => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    const donorUser = await getUser(donation.donorId);
    if (!donorUser || !donorUser.userKey) {
        throw new Error("Cannot create donation. The selected donor does not have a UserKey.");
    }
    
    const donationsCollection = collection(db, DONATIONS_COLLECTION);
    const countSnapshot = await getCountFromServer(donationsCollection);
    const donationNumber = countSnapshot.data().count + 1;
    
    const dateString = format(new Date(), 'ddMMyyyy');
    const customDonationId = `${donationNumber}_${donorUser.userKey}_${dateString}`;
    
    const donationRef = doc(db, DONATIONS_COLLECTION, customDonationId);
    
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
export const getDonation = async (id: string): Promise<Donation | null> => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    const donationDoc = await getDoc(doc(db, DONATIONS_COLLECTION, id));
    if (donationDoc.exists()) {
      const data = donationDoc.data();
      const allocations = (data.allocations || []).map((alloc: Allocation) => ({
        ...alloc,
        allocatedAt: (alloc.allocatedAt as Timestamp).toDate(),
      }));
      return { 
        id: donationDoc.id, 
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
        donationDate: data.donationDate ? (data.donationDate as Timestamp).toDate() : new Date(),
        verifiedAt: data.verifiedAt ? (data.verifiedAt as Timestamp).toDate() : undefined,
        allocations: allocations,
      } as Donation;
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
    adminUser?: Pick<User, 'id' | 'name' | 'email'>,
    customActivity?: string
) => {
    if (!isConfigValid) throw new Error('Firebase is not configured.');
    try {
        const donationRef = doc(db, DONATIONS_COLLECTION, id);
        
        if (adminUser) {
            const originalDonation = await getDonation(id);
            await updateDoc(donationRef, { ...updates, updatedAt: serverTimestamp() });

            if(originalDonation) {
                // Handle custom activity logging first
                if (customActivity) {
                     await logActivity({
                        userId: adminUser.id!,
                        userName: adminUser.name,
                        userEmail: adminUser.email,
                        role: 'Admin',
                        activity: customActivity,
                        details: { 
                            donationId: id,
                            donorName: originalDonation.donorName,
                            amount: originalDonation.amount,
                        }
                     });
                }
                // Then handle standard status or update logging
                else if(updates.status && originalDonation.status !== updates.status) {
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
             await updateDoc(donationRef, { ...updates, updatedAt: serverTimestamp() });
        }

    } catch (error) {
        console.error("Error updating donation: ", error);
        throw new Error('Failed to update donation.');
    }
};

// Function to delete a donation
export const deleteDonation = async (id: string, adminUser: Pick<User, 'id' | 'name' | 'email'>) => {
    if (!isConfigValid) throw new Error('Firebase is not configured.');
    try {
        const donationToDelete = await getDonation(id);
        if (!donationToDelete) throw new Error("Donation to delete not found.");

        await deleteDoc(doc(db, DONATIONS_COLLECTION, id));

         await logActivity({
            userId: adminUser.id!,
            userName: adminUser.name,
            userEmail: adminUser.email,
            role: 'Admin',
            activity: 'Donation Deleted',
            details: { 
                donationId: id, 
                donorName: donationToDelete.donorName, 
                amount: donationToDelete.amount,
            },
        });
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
        const donationsQuery = query(collection(db, DONATIONS_COLLECTION), orderBy("donationDate", "desc"));
        const querySnapshot = await getDocs(donationsQuery);
        const donations: Donation[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const allocations = (data.allocations || []).map((alloc: Allocation) => ({
                ...alloc,
                allocatedAt: (alloc.allocatedAt as Timestamp).toDate(),
            }));
            donations.push({ 
              id: doc.id, 
              ...data,
              createdAt: (data.createdAt as Timestamp).toDate(),
              donationDate: data.donationDate ? (data.donationDate as Timestamp).toDate() : new Date(),
              verifiedAt: data.verifiedAt ? (data.verifiedAt as Timestamp).toDate() : undefined,
              allocations: allocations,
            } as Donation);
        });
        return donations;
    } catch (error) {
        console.error("Error getting all donations: ", error);
        if (error instanceof Error && error.message.includes('index')) {
             console.error("Firestore index missing for 'donations' collection on 'donationDate' (desc).");
        }
        return [];
    }
}

// Function to get all donations for a specific user
export const getDonationsByUserId = async (userId: string): Promise<Donation[]> => {
    if (!isConfigValid) return [];
    try {
        const donationsQuery = query(
            collection(db, DONATIONS_COLLECTION), 
            where("donorId", "==", userId)
        );
        const querySnapshot = await getDocs(donationsQuery);
        const donations: Donation[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            donations.push({
              id: doc.id,
              ...data,
              createdAt: (data.createdAt as Timestamp).toDate(),
              donationDate: data.donationDate ? (data.donationDate as Timestamp).toDate() : new Date(),
              verifiedAt: data.verifiedAt ? (data.verifiedAt as Timestamp).toDate() : undefined,
            } as Donation);
        });
        // Sort in memory instead of in the query
        donations.sort((a, b) => (b.donationDate as Date).getTime() - (a.donationDate as Date).getTime());
        return donations;
    } catch (error) {
        console.error("Error fetching user donations:", error);
         if (error instanceof Error && error.message.includes('requires an index')) {
            const detailedError = `Firestore query error. This typically indicates a missing index. Try creating a single-field index on 'donorId' in the 'donations' collection. Full error: ${error.message}`;
            console.error(detailedError);
        }
        return [];
    }
}

// Function to get donations by campaignId
export const getDonationsByCampaignId = async (campaignId: string): Promise<Donation[]> => {
    if (!isConfigValid) return [];
    try {
        const donationsQuery = query(
            collection(db, DONATIONS_COLLECTION), 
            where("campaignId", "==", campaignId),
            orderBy("donationDate", "desc")
        );
        const querySnapshot = await getDocs(donationsQuery);
        const donations: Donation[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            donations.push({
              id: doc.id,
              ...data,
              createdAt: (data.createdAt as Timestamp).toDate(),
              donationDate: data.donationDate ? (data.donationDate as Timestamp).toDate() : new Date(),
              verifiedAt: data.verifiedAt ? (data.verifiedAt as Timestamp).toDate() : undefined,
            } as Donation);
        });
        return donations;
    } catch (error) {
        console.error("Error fetching campaign donations:", error);
        if (error instanceof Error && error.message.includes('index')) {
             console.error("Firestore index missing. Please create a composite index in Firestore on the 'donations' collection for 'campaignId' (ascending) and 'donationDate' (descending).");
        }
        return [];
    }
};

// Quick status update function
export const handleUpdateDonationStatus = async (donationId: string, newStatus: DonationStatus, adminUser: Pick<User, 'id' | 'name' | 'email'>) => {
    const originalDonation = await getDonation(donationId);
    if (!originalDonation) {
        throw new Error("Donation not found");
    }

    const updates: Partial<Donation> = { status: newStatus };
    if (newStatus === 'Verified' && originalDonation.status !== 'Verified') {
        updates.verifiedAt = Timestamp.now();
    }
    
    await updateDonation(donationId, updates, adminUser);
};

export const allocateDonationToLeads = async (
  donation: Donation,
  allocations: { leadId: string; amount: number }[],
  adminUser: User
) => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');

  const batch = writeBatch(db);
  const now = Timestamp.now();
  
  const currentTotalAllocated = (donation.allocations || []).reduce((sum, alloc) => sum + alloc.amount, 0);
  const newAllocationTotal = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
  const finalTotalAllocated = currentTotalAllocated + newAllocationTotal;
  
  // 1. Process allocations for each lead
  for (const alloc of allocations) {
    if (alloc.amount <= 0) continue;
    
    const leadRef = doc(db, LEADS_COLLECTION, alloc.leadId);
    const newAllocationRecord: LeadDonationAllocation = {
      donationId: donation.id!,
      amount: alloc.amount,
      allocatedAt: now,
      allocatedByUserId: adminUser.id!,
      allocatedByUserName: adminUser.name,
    };
    
    // Update the lead document
    batch.update(leadRef, {
      donations: arrayUnion(newAllocationRecord),
      helpGiven: increment(alloc.amount)
    });
  }
  
  // 2. Determine the new status for the donation
  let newStatus: DonationStatus = 'Partially Allocated';
  if (finalTotalAllocated >= donation.amount) {
      newStatus = 'Allocated';
  }

  // 3. Update the main donation document
  const donationRef = doc(db, DONATIONS_COLLECTION, donation.id!);
  const newLeadAllocations: Allocation[] = allocations.map(a => ({
    leadId: a.leadId,
    amount: a.amount,
    allocatedAt: now,
    allocatedByUserId: adminUser.id!,
    allocatedByUserName: adminUser.name,
  }));
  
  batch.update(donationRef, {
      status: newStatus,
      allocations: arrayUnion(...newLeadAllocations),
      updatedAt: serverTimestamp(),
  });

  // 4. Log this bulk allocation activity
  await logActivity({
    userId: adminUser.id!,
    userName: adminUser.name,
    userEmail: adminUser.email,
    role: "Admin",
    activity: `Donation Allocated`,
    details: { 
        donationId: donation.id!, 
        amount: newAllocationTotal,
        newStatus: newStatus,
        allocations: allocations.map(a => ({ leadId: a.leadId, amount: a.amount }))
    }
  });

  // Commit all writes at once
  await batch.commit();
};
