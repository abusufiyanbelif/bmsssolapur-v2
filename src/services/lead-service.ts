

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
import type { Lead, LeadStatus, LeadVerificationStatus, LeadPurpose } from './types';

// Re-export types for backward compatibility
export type { Lead, LeadStatus, LeadVerificationStatus, LeadPurpose };

const LEADS_COLLECTION = 'leads';

// Function to create a lead
export const createLead = async (leadData: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'helpGiven' | 'status' | 'verifiedStatus' | 'verifiers' | 'dateCreated' | 'adminAddedBy' | 'donations'>>, adminUser: { id: string, name: string }) => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    const leadRef = doc(collection(db, LEADS_COLLECTION));
    const newLead: Lead = {
      ...leadData,
      id: leadRef.id,
      name: leadData.name!,
      beneficiaryId: leadData.beneficiaryId!,
      helpRequested: leadData.helpRequested!,
      purpose: leadData.purpose!,
      donationType: leadData.donationType!,
      acceptableDonationTypes: leadData.acceptableDonationTypes || [],
      helpGiven: 0,
      status: 'Pending',
      verifiedStatus: 'Pending',
      verifiers: [],
      donations: [],
      dateCreated: Timestamp.now(),
      adminAddedBy: {
        id: adminUser.id,
        name: adminUser.name
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isLoan: leadData.isLoan || false,
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
        console.warn("Firebase not configured. Returning empty array for leads.");
        return [];
    }
    try {
        const leadsQuery = query(collection(db, LEADS_COLLECTION));
        const querySnapshot = await getDocs(leadsQuery);
        const leads: Lead[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as Lead;
            leads.push({ 
              id: doc.id,
              ...data,
              dateCreated: (data.dateCreated as Timestamp).toDate(),
              createdAt: (data.createdAt as Timestamp).toDate(),
              updatedAt: (data.updatedAt as Timestamp).toDate(),
              closedAt: data.closedAt ? (data.closedAt as Timestamp).toDate() : undefined,
              dueDate: data.dueDate ? (data.dueDate as any).toDate() : undefined, // Handle potential timestamp
            });
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
            const data = doc.data() as Lead;
            leads.push({ 
                id: doc.id, 
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate()
            });
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

// Function to get open leads for a specific beneficiary
export const getOpenLeadsByBeneficiaryId = async (beneficiaryId: string): Promise<Lead[]> => {
    if (!isConfigValid) return [];
    try {
        const leadsQuery = query(
            collection(db, LEADS_COLLECTION),
            where("beneficiaryId", "==", beneficiaryId),
            where("status", "in", ["Pending", "Partial"])
        );
        const querySnapshot = await getDocs(leadsQuery);
        const leads: Lead[] = [];
        querySnapshot.forEach((doc) => {
            leads.push({ id: doc.id, ...doc.data() } as Lead);
        });
        return leads;
    } catch (error) {
        console.error("Error getting open beneficiary leads: ", error);
        if (error instanceof Error && error.message.includes('index')) {
            console.error("Firestore index missing. Please create a composite index in Firestore on the 'leads' collection for 'beneficiaryId' (ascending) and 'status' (ascending).");
        }
        throw new Error('Failed to get open beneficiary leads.');
    }
}
