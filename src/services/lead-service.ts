
/**
 * @fileOverview Lead service for interacting with Firestore.
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
import { DonationType } from './donation-service';

const LEADS_COLLECTION = 'leads';

export type LeadStatus = 'Pending' | 'Partial' | 'Closed';
export type LeadVerificationStatus = 'Pending' | 'Verified' | 'Rejected';
export type LeadPurpose = 'Education' | 'Medical' | 'Relief Fund' | 'Deen';


export interface Verifier {
    verifierId: string;
    verifierName: string;
    verifiedAt: Timestamp;
    notes?: string;
}

export interface LeadDonationAllocation {
    donationId: string;
    amount: number;
}

export interface Lead {
  id?: string;
  name: string; // Can be "Anonymous"
  beneficiaryId: string; // ID of the user who is the beneficiary
  category: DonationType; // Original category for fund source compatibility
  purpose: LeadPurpose; // New primary category
  subCategory?: string; // New secondary category
  otherCategoryDetail?: string; // Details if sub-category is 'Other'
  helpRequested: number;
  helpGiven: number;
  status: LeadStatus;
  isLoan: boolean; // To mark if the help is a repayable loan
  caseDetails?: string; // Formerly 'notes'
  verificationDocumentUrl?: string;
  verifiedStatus: LeadVerificationStatus;
  verifiers: Verifier[];
  donations: LeadDonationAllocation[];
  verificationNotes?: string;
  dateCreated: Timestamp;
  adminAddedBy: string; // ID of the admin who created the lead
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Function to create a lead
export const createLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'helpGiven' | 'status' | 'dateCreated' | 'adminAddedBy' | 'verifiedStatus' | 'verifiers' | 'category' | 'donations'>, adminId: string) => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    const leadRef = doc(collection(db, LEADS_COLLECTION));
    const newLead: Omit<Lead, 'id'> & { id: string } = {
      ...leadData,
      id: leadRef.id,
      helpGiven: 0,
      status: 'Pending',
      verifiedStatus: 'Pending',
      verifiers: [],
      donations: [],
      // Assign a default category for backward compatibility or filtering logic
      category: leadData.purpose === 'Education' ? 'Sadaqah' : 'Lillah',
      dateCreated: Timestamp.now(),
      adminAddedBy: adminId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await setDoc(leadRef, newLead);
    return newLead;
  } catch (error) {
    console.error('Error creating lead: ', error);
    throw new Error('Failed to create lead.');
  }
};

// Function to get a lead by ID
export const getLead = async (id: string) => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    const leadDoc = await getDoc(doc(db, LEADS_COLLECTION, id));
    if (leadDoc.exists()) {
      return { id: leadDoc.id, ...leadDoc.data() } as Lead;
    }
    return null;
  } catch (error) {
    console.error('Error getting lead: ', error);
    throw new Error('Failed to get lead.');
  }
};

// Function to update a lead
export const updateLead = async (id: string, updates: Partial<Omit<Lead, 'id' | 'createdAt'>>) => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    const leadRef = doc(db, LEADS_COLLECTION, id);
    await updateDoc(leadRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating lead: ", error);
    throw new Error('Failed to update lead.');
  }
};

// Function to delete a lead
export const deleteLead = async (id: string) => {
    if (!isConfigValid) throw new Error('Firebase is not configured.');
    try {
        await deleteDoc(doc(db, LEADS_COLLECTION, id));
    } catch (error) {
        console.error("Error deleting lead: ", error);
        throw new Error('Failed to delete lead.');
    }
}

// Function to get all leads
export const getAllLeads = async (): Promise<Lead[]> => {
    if (!isConfigValid) {
        console.warn("Firebase not configured. Skipping fetching all leads.");
        return [];
    }
    try {
        const leadsQuery = query(collection(db, LEADS_COLLECTION));
        const querySnapshot = await getDocs(leadsQuery);
        const leads: Lead[] = [];
        querySnapshot.forEach((doc) => {
            leads.push({ id: doc.id, ...doc.data() } as Lead);
        });
        return leads;
    } catch (error) {
        console.error("Error getting all leads: ", error);
        throw new Error('Failed to get all leads.');
    }
}

// Function to get all leads for a specific beneficiary
export const getLeadsByBeneficiaryId = async (beneficiaryId: string): Promise<Lead[]> => {
    if (!isConfigValid) return [];
    try {
        const leadsQuery = query(
            collection(db, LEADS_COLLECTION), 
            where("beneficiaryId", "==", beneficiaryId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(leadsQuery);
        const leads: Lead[] = [];
        querySnapshot.forEach((doc) => {
            leads.push({ id: doc.id, ...doc.data() } as Lead);
        });
        return leads;
    } catch (error) {
        console.error("Error getting beneficiary leads: ", error);
         if (error instanceof Error && error.message.includes('index')) {
             console.error("Firestore index missing. Please create a composite index in Firestore on the 'leads' collection for 'beneficiaryId' (ascending) and 'createdAt' (descending).");
        }
        throw new Error('Failed to get beneficiary leads.');
    }
}
