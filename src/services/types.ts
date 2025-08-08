
/**
 * @fileOverview Centralized type definitions for the application's data models.
 */

import type { Timestamp, FieldValue } from 'firebase/firestore';

// User-related types
export type UserRole = 
  | 'Guest'
  | 'Donor'
  | 'Beneficiary'
  | 'Referral'
  | 'Admin'
  | 'Finance Admin'
  | 'Super Admin';

export type Privilege =
  | 'all'
  | 'canManageUsers'
  | 'canManageRoles'
  | 'canManageLeads'
  | 'canVerifyLeads'
  | 'canManageDonations'
  | 'canVerifyDonations'
  | 'canViewFinancials'
  | 'canExportData'
  | 'canManageSettings';

export interface User {
  id?: string;
  userId?: string; // Custom, user-defined ID
  name: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  phone: string;
  password?: string;
  isActive: boolean;
  address?: {
    addressLine1?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  gender?: 'Male' | 'Female' | 'Other';
  beneficiaryType?: 'Adult' | 'Old Age' | 'Kid' | 'Family';
  isAnonymousAsBeneficiary?: boolean;
  isAnonymousAsDonor?: boolean;
  anonymousBeneficiaryId?: string;
  anonymousDonorId?: string;
  occupation?: string;
  familyMembers?: number;
  isWidow?: boolean;
  secondaryPhone?: string; 
  aadhaarNumber?: string; 
  panNumber?: string; 
  upiIds?: string[];
  roles: UserRole[]; 
  privileges?: Privilege[]; 
  groups?: string[];
  enableMonthlyDonationReminder?: boolean;
  monthlyPledgeEnabled?: boolean;
  monthlyPledgeAmount?: number;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

// Donation-related types
export type DonationStatus = 'Pending verification' | 'Verified' | 'Failed/Incomplete' | 'Allocated';
export type DonationType = 'Zakat' | 'Sadaqah' | 'Fitr' | 'Lillah' | 'Kaffarah' | 'Split' | 'Any';
export type DonationPurpose = 'Education' | 'Deen' | 'Hospital' | 'Loan and Relief Fund' | 'To Organization Use' | 'Loan Repayment';

export interface Allocation {
  leadId: string;
  amount: number;
  allocatedAt: Timestamp;
}

export interface Donation {
  id?: string;
  donorId: string;
  donorName: string;
  amount: number;
  type: DonationType;
  purpose?: DonationPurpose;
  status: DonationStatus;
  isAnonymous?: boolean;
  leadId?: string;
  campaignId?: string;
  paymentScreenshotUrl?: string;
  transactionId?: string;
  donationDate: Timestamp | Date;
  donorUpiId?: string;
  paymentApp?: string;
  createdAt: Timestamp;
  verifiedAt?: Timestamp;
  allocations?: Allocation[];
  notes?: string;
}

// Lead-related types
export type LeadStatus = 'Pending' | 'Partial' | 'Closed';
export type LeadVerificationStatus = 'Pending' | 'Verified' | 'Rejected';
export type LeadPurpose = 'Education' | 'Medical' | 'Relief Fund' | 'Deen' | 'Loan' | 'Other';

export interface Verifier {
    verifierId: string;
    verifierName: string;
    verifiedAt: Timestamp;
    notes?: string;
}

export interface LeadDonationAllocation {
    donationId: string;
    amount: number;
    allocatedByUserId: string;
    allocatedByUserName: string;
aoi.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
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
  serverTimestamp,
  where,
  orderBy
} from 'firebase/firestore';
import { db, isConfigValid } from './firebase';
import type { Donation, DonationStatus, DonationType, DonationPurpose, User } from './types';
import { getUser } from './user-service';

// Re-export types for backward compatibility if other services import from here
export type { Donation, DonationStatus, DonationType, DonationPurpose };
export { getUser };

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
        const donationsQuery = query(collection(db, DONATIONS_COLLECTION), orderBy("donationDate", "desc"));
        const querySnapshot = await getDocs(donationsQuery);
        const donations: Donation[] = [];
        querySnapshot.forEach((doc) => {
            donations.push({ id: doc.id, ...doc.data() } as Donation);
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
            where("donorId", "==", userId),
            orderBy("donationDate", "desc")
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
             console.error("Firestore index missing. Please create a composite index in Firestore on the 'donations' collection for 'donorId' (ascending) and 'donationDate' (descending).");
        }
        throw new Error('Failed to get user donations.');
    }
}
