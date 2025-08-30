

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
  orderBy,
  getCountFromServer,
  increment,
  arrayUnion,
  limit,
} from 'firebase/firestore';
import { db, isConfigValid } from './firebase';
import type { Lead, LeadStatus, LeadVerificationStatus, LeadPurpose, User, Verifier, LeadDonationAllocation, DonationType, FundTransfer, LeadAction } from './types';
import { logActivity } from './activity-log-service';
import { getUser } from './user-service';
import { format } from 'date-fns';


// Re-export types for backward compatibility
export type { Lead, LeadStatus, LeadVerificationStatus, LeadPurpose };

const LEADS_COLLECTION = 'leads';

// Function to create a lead
export const createLead = async (leadData: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'helpGiven' | 'status' | 'verifiedStatus' | 'verifiers' | 'dateCreated' | 'adminAddedBy' | 'donations' | 'otherCategoryDetail'>>, adminUser: { id: string, name: string }) => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    // --- Custom Lead ID Generation ---
    const beneficiary = await getUser(leadData.beneficiaryId!);
    if (!beneficiary) throw new Error("Beneficiary not found for lead creation.");
    if (!beneficiary.userKey) throw new Error("Beneficiary does not have a UserKey. Cannot create lead.");

    const leadsCollection = collection(db, LEADS_COLLECTION);
    const q = query(leadsCollection, where("beneficiaryId", "==", beneficiary.id!));
    const beneficiaryLeadsSnapshot = await getDocs(q);
    const leadNumber = beneficiaryLeadsSnapshot.size + 1;

    const dateString = format(new Date(), 'ddMMyyyy');
    const customLeadId = `${beneficiary.userKey}_${leadNumber}_${dateString}`;

    const leadRef = doc(db, LEADS_COLLECTION, customLeadId);
    // --- End Custom Lead ID Generation ---

    const newLead: Partial<Lead> = {
      id: leadRef.id,
      name: leadData.name!,
      beneficiaryId: leadData.beneficiaryId!,
      campaignId: leadData.campaignId || undefined,
      campaignName: leadData.campaignName || undefined,
      headline: leadData.headline,
      story: leadData.story,
      purpose: leadData.purpose!,
      otherPurposeDetail: leadData.otherPurposeDetail || undefined,
      donationType: leadData.donationType!,
      acceptableDonationTypes: leadData.acceptableDonationTypes || [],
      category: leadData.category,
      otherCategoryDetail: leadData.otherCategoryDetail || undefined,
      priority: leadData.priority || 'Medium',
      helpRequested: leadData.helpRequested!,
      helpGiven: 0,
      caseStatus: 'Pending',
      caseAction: 'Pending',
      caseVerification: 'Pending',
      verifiers: [],
      donations: [],
      caseDetails: leadData.caseDetails,
      verificationDocumentUrl: leadData.verificationDocumentUrl,
      adminAddedBy: { id: adminUser.id, name: adminUser.name },
      referredByUserId: leadData.referredByUserId,
      referredByUserName: leadData.referredByUserName,
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
            delete (newLead as any)[typedKey];
        }
    });

    await setDoc(leadRef, newLead);
    return newLead as Lead;
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
        dateCreated: data.dateCreated ? (data.dateCreated as Timestamp).toDate() : new Date(),
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date(),
        closedAt: data.closedAt ? (data.closedAt as Timestamp).toDate() : undefined,
        dueDate: data.dueDate ? (data.dueDate as any).toDate() : undefined,
        verificationDueDate: data.verificationDueDate ? (data.verificationDueDate as any).toDate() : undefined,
        verifiers: (data.verifiers || []).map((v: Verifier) => ({...v, verifiedAt: (v.verifiedAt as Timestamp).toDate() })),
        donations: (data.donations || []).map((d: LeadDonationAllocation) => ({...d, allocatedAt: (d.allocatedAt as Timestamp).toDate() })),
        fundTransfers: (data.fundTransfers || []).map((t: any) => ({...t, transferredAt: (t.transferredAt as Timestamp).toDate() })),
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
    
    // Handle special array union and increment updates
    const finalUpdates: any = { ...updates, updatedAt: serverTimestamp() };
    if (updates.donations) {
        finalUpdates.donations = arrayUnion(...updates.donations);
    }
    if (updates.helpGiven) {
        finalUpdates.helpGiven = increment(updates.helpGiven);
    }

    await updateDoc(leadRef, finalUpdates);
  } catch (error) {
    console.error("Error updating lead: ", error);
    throw new Error('Failed to update lead.');
  }
};

// Function to delete a lead
export const deleteLead = async (id: string, adminUser: Pick<User, 'id' | 'name' | 'email'>) => {
    if (!isConfigValid) throw new Error('Firebase is not configured.');
    try {
        const leadToDelete = await getLead(id);
        if (!leadToDelete) throw new Error("Lead to delete not found.");

        await deleteDoc(doc(db, LEADS_COLLECTION, id));
        
         await logActivity({
            userId: adminUser.id!,
            userName: adminUser.name,
            userEmail: adminUser.email,
            role: 'Admin',
            activity: 'Lead Deleted',
            details: { 
                leadId: id, 
                leadName: leadToDelete.name,
                amount: leadToDelete.helpRequested,
            },
        });
    } catch (error) {
        console.error("Error deleting lead: ", error);
        throw new Error('Failed to delete lead.');
    }
}

// Quick status update functions
export const updateLeadStatus = async (id: string, newStatus: LeadStatus, adminUser: Pick<User, 'id' | 'name' | 'email'>) => {
    const lead = await getLead(id);
    if (!lead) throw new Error("Lead not found for status update.");
    
    await logActivity({
        userId: adminUser.id!,
        userName: adminUser.name,
        userEmail: adminUser.email,
        role: "Admin",
        activity: `Lead Status Changed`,
        details: { leadId: id, leadName: lead.name, from: lead.caseStatus, to: newStatus }
    });

    return updateLead(id, { caseStatus: newStatus });
};

export const updateLeadVerificationStatus = async (id: string, newStatus: LeadVerificationStatus, adminUser: Pick<User, 'id' | 'name' | 'email'>) => {
    const lead = await getLead(id);
    if (!lead) throw new Error("Lead not found for verification status update.");
    
    const updates: Partial<Lead> = { caseVerification: newStatus };
    if (newStatus === 'Verified') {
        updates.caseAction = 'Ready For Help';
    }
    
    await logActivity({
        userId: adminUser.id!,
        userName: adminUser.name,
        userEmail: adminUser.email,
        role: "Admin",
        activity: `Lead Verification Changed`,
        details: { leadId: id, leadName: lead.name, from: lead.caseVerification, to: newStatus }
    });
    
    return updateLead(id, updates);
};


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
            const data = doc.data();
            const enrichedData = { 
              id: doc.id,
              ...data,
              dateCreated: data.dateCreated ? (data.dateCreated as Timestamp).toDate() : new Date(),
              createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
              updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date(),
              closedAt: data.closedAt ? (data.closedAt as Timestamp).toDate() : undefined,
              dueDate: data.dueDate ? (data.dueDate as any).toDate() : undefined,
              verificationDueDate: data.verificationDueDate ? (data.verificationDueDate as any).toDate() : undefined,
              verifiers: (data.verifiers || []).map((v: Verifier) => ({...v, verifiedAt: (v.verifiedAt as Timestamp).toDate() })),
              donations: (data.donations || []).map((d: LeadDonationAllocation) => ({...d, allocatedAt: (d.allocatedAt as Timestamp).toDate() })),
              fundTransfers: (data.fundTransfers || []).map((t: FundTransfer) => ({...t, transferredAt: (t.transferredAt as Timestamp).toDate() })),
            } as Lead;
            
            // Add derived fields for sorting
            const enrichedLead: any = { ...enrichedData };
            if (enrichedData.verifiers && enrichedData.verifiers.length > 0) {
                 enrichedLead.verifiedAt = enrichedData.verifiers.sort((a,b) => (b.verifiedAt as any) - (a.verifiedAt as any))[0].verifiedAt;
            }
            if (enrichedData.donations && enrichedData.donations.length > 0) {
                enrichedLead.lastAllocatedAt = enrichedData.donations.sort((a,b) => (b.allocatedAt as any) - (a.allocatedAt as any))[0].allocatedAt;
            }

            leads.push(enrichedLead);
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
            where("beneficiaryId", "==", beneficiaryId)
        );
        const querySnapshot = await getDocs(leadsQuery);
        const leads: Lead[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as Omit<Lead, 'id'>;
            leads.push({ 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
            } as Lead);
        });
        // Sort in memory instead of in the query
        leads.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
        return leads;
    } catch (error) {
        console.error("Error fetching beneficiary leads:", error);
         if (error instanceof Error && error.message.includes('requires an index')) {
            const detailedError = `Firestore query error. This typically indicates a missing index. Try creating a single-field index on 'beneficiaryId' in the 'leads' collection. Full error: ${error.message}`;
            console.error(detailedError);
            throw new Error(detailedError);
        }
        throw new Error('Failed to get beneficiary leads.');
    }
}

// Function to get leads by campaignId
export const getLeadsByCampaignId = async (campaignId: string): Promise<Lead[]> => {
    if (!isConfigValid) return [];
    try {
        const leadsQuery = query(
            collection(db, LEADS_COLLECTION), 
            where("campaignId", "==", campaignId),
            orderBy("dateCreated", "desc")
        );
        const querySnapshot = await getDocs(leadsQuery);
        const leads: Lead[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as Omit<Lead, 'id'>;
            leads.push({ 
                id: doc.id, 
                ...data,
                dateCreated: data.dateCreated ? (data.dateCreated as Timestamp).toDate() : new Date(),
                createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
            } as Lead);
        });
        return leads;
    } catch (error) {
        console.error("Error fetching campaign leads:", error);
        if (error instanceof Error && error.message.includes('index')) {
             console.error("Firestore index missing. Please create a composite index in Firestore on the 'leads' collection for 'campaignId' (ascending) and 'dateCreated' (descending).");
        }
        return [];
    }
};

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
