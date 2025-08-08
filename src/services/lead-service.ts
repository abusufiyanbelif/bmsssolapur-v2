

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
import type { Lead, LeadStatus, LeadVerificationStatus, LeadPurpose, User } from './types';

// Re-export types for backward compatibility
export type { Lead, LeadStatus, LeadVerificationStatus, LeadPurpose };

// Function to create a lead
export const createLead = async (leadData: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'helpGiven' | 'status' | 'verifiedStatus' | 'verifiers' | 'dateCreated' | 'adminAddedBy' | 'donations'>>, adminUser: { id: string, name: string }) => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    const leadRef = doc(collection(db, LEADS_COLLECTION));
    
    const newLead: Lead = {
      id: leadRef.id,
      name: leadData.name!,
      beneficiaryId: leadData.beneficiaryId!,
      campaignId: leadData.campaignId || undefined,
      campaignName: leadData.campaignName || undefined,
      purpose: leadData.purpose!,
      otherPurposeDetail: leadData.otherPurposeDetail || undefined,
      donationType: leadData.donationType!,
      acceptableDonationTypes: leadData.acceptableDonationTypes || [],
      category: leadData.category,
      otherCategoryDetail: leadData.otherCategoryDetail || undefined,
      helpRequested: leadData.helpRequested!,
      helpGiven: 0,
      status: 'Pending',
      verifiedStatus: 'Pending',
      verifiers: [],
      donations: [],
      caseDetails: leadData.caseDetails,
      verificationDocumentUrl: leadData.verificationDocumentUrl,
      adminAddedBy: { id: adminUser.id, name: adminUser.name },
      dateCreated: Timestamp.now(),
      dueDate: leadData.dueDate ? Timestamp.fromDate(leadData.dueDate) : undefined,
      closedAt: undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isLoan: leadData.isLoan || false,
    };
    
    // Remove undefined fields to prevent Firestore errors
    Object.keys(newLead).forEach(key => {
        const typedKey = key as keyof Lead;
        if (newLead[typedKey] === undefined) {
            delete newLead[typedKey];
        }
    });

    await setDoc(leadRef, newLead);
    return newLead;
  } catch (error) {
    console.error('Error creating lead: ', error);
    throw new Error('Failed to create lead in Firestore.');
  }
};

// Function to get a lead by ID
export const getLead = async (id: string): Promise<Lead | null> => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    const leadDoc = await getDoc(doc(db, LEADS_COLLECTION, id));
    if (leadDoc.exists()) {
      const data = leadDoc.data();
      // Manually convert Timestamps to Dates for client-side compatibility
      return { 
        id: leadDoc.id, 
        ...data,
        dateCreated: (data.dateCreated as Timestamp).toDate(),
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
        closedAt: data.closedAt ? (data.closedAt as Timestamp).toDate() : undefined,
        dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate() : undefined,
        verifiers: data.verifiers?.map((v: Verifier) => ({...v, verifiedAt: (v.verifiedAt as Timestamp).toDate() })) || [],
        donations: data.donations?.map((d: LeadDonationAllocation) => ({...d, allocatedAt: (d.allocatedAt as Timestamp).toDate() })) || [],
      } as Lead;
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
        const leadsQuery = query(collection(db, LEADS_COLLECTION), orderBy("dateCreated", "desc"));
        const querySnapshot = await getDocs(leadsQuery);
        const leads: Lead[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as Omit<Lead, 'id'>;
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
        if (error instanceof Error && error.message.includes('index')) {
             console.error("Firestore index missing. Please create a descending index on 'dateCreated' for the 'leads' collection.");
        }
        return [];
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
