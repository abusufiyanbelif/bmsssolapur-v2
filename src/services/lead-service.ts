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
import { db } from './firebase';
import type { Lead, LeadStatus, LeadVerificationStatus, LeadPurpose, User, Verifier, LeadDonationAllocation, DonationType, FundTransfer, LeadAction } from './types';
import { logActivity } from './activity-log-service';
import { getUser } from './user-service';
import { format } from 'date-fns';


// Re-export types for backward compatibility
export type { Lead, LeadStatus, LeadVerificationStatus, LeadPurpose, LeadAction };

const LEADS_COLLECTION = 'leads';

// Function to create a lead
export const createLead = async (leadData: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>>, adminUser: User) => {
  if (!adminUser || !adminUser.id) throw new Error('Admin user details are required to create a lead.');
  
  try {
    let customLeadId: string;
    const leadsCollection = collection(db, LEADS_COLLECTION);
    const dateString = format(new Date(), 'ddMMyyyy');
    
    const beneficiaryUser = leadData.beneficiaryId ? await getUser(leadData.beneficiaryId) : null;
    
    if (beneficiaryUser && beneficiaryUser.userKey) {
        const q = query(leadsCollection, where("beneficiaryId", "==", beneficiaryUser.id!));
        const beneficiaryLeadsSnapshot = await getDocs(q);
        const leadNumber = beneficiaryLeadsSnapshot.size + 1;

        customLeadId = `${beneficiaryUser.userKey}_${leadNumber}_${dateString}`;
    } else if (leadData.beneficiaryId && (!beneficiaryUser || !beneficiaryUser.userKey)) {
        // If there's a beneficiaryId but we can't find the user or their key
        throw new Error(`The selected beneficiary ("${leadData.name}") does not have a valid UserKey. Please ensure the user profile is complete.`);
    } else {
        // Case where we are linking the beneficiary later
        const q = query(leadsCollection); // Query without filter to get total count
        const countSnapshot = await getCountFromServer(q);
        const leadNumber = countSnapshot.data().count + 1;
        customLeadId = `LEAD${leadNumber}_${dateString}`;
    }

    const leadRef = doc(db, LEADS_COLLECTION, customLeadId);
    
    const newLead: Lead = { 
        id: leadRef.id,
        name: leadData.name!,
        beneficiaryId: leadData.beneficiaryId,
        campaignId: leadData.campaignId || undefined,
        campaignName: leadData.campaignName || undefined,
        headline: leadData.headline,
        story: leadData.story,
        purpose: leadData.purpose!,
        otherPurposeDetail: leadData.otherPurposeDetail,
        donationType: leadData.donationType!,
        acceptableDonationTypes: leadData.acceptableDonationTypes || [],
        category: leadData.category!,
        otherCategoryDetail: leadData.otherCategoryDetail,
        priority: leadData.priority || 'Medium',
        helpRequested: leadData.helpRequested || 0,
        collectedAmount: leadData.collectedAmount || 0,
        fundingGoal: leadData.fundingGoal,
        helpGiven: leadData.helpGiven || 0,
        caseStatus: leadData.caseStatus || 'Pending',
        caseAction: leadData.caseAction || 'Pending',
        caseVerification: leadData.caseVerification || 'Pending',
        verifiers: leadData.verifiers || [],
        donations: leadData.donations || [],
        caseDetails: leadData.caseDetails,
        verificationDocumentUrl: leadData.verificationDocumentUrl,
        adminAddedBy: { id: adminUser.id, name: adminUser.name },
        referredByUserId: leadData.referredByUserId,
        referredByUserName: leadData.referredByUserName,
        dateCreated: leadData.dateCreated instanceof Date ? leadData.dateCreated : new Date(),
        caseReportedDate: (leadData.caseReportedDate instanceof Date) ? leadData.caseReportedDate : undefined,
        dueDate: leadData.dueDate instanceof Date ? leadData.dueDate : undefined,
        closedAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        isLoan: leadData.isLoan || false,
        isHistoricalRecord: leadData.isHistoricalRecord || false,
        source: 'Manual Entry',
        degree: leadData.degree,
        year: leadData.year,
        semester: leadData.semester,
    };
    
    // Convert Dates to Timestamps for writing
    const dataToWrite: any = { ...newLead };
    
    if (dataToWrite.dateCreated && dataToWrite.dateCreated.getTime) dataToWrite.dateCreated = Timestamp.fromDate(dataToWrite.dateCreated);
    if (dataToWrite.createdAt && dataToWrite.createdAt.getTime) dataToWrite.createdAt = Timestamp.fromDate(dataToWrite.createdAt);
    if (dataToWrite.updatedAt && dataToWrite.updatedAt.getTime) dataToWrite.updatedAt = Timestamp.fromDate(dataToWrite.updatedAt);
    if (dataToWrite.caseReportedDate && dataToWrite.caseReportedDate.getTime) dataToWrite.caseReportedDate = Timestamp.fromDate(dataToWrite.caseReportedDate);
    if (dataToWrite.dueDate && dataToWrite.dueDate.getTime) dataToWrite.dueDate = Timestamp.fromDate(dataToWrite.dueDate);

    
    // Remove undefined fields to prevent Firestore errors
    Object.keys(dataToWrite).forEach(key => {
        if ((dataToWrite as any)[key] === undefined) {
            delete (dataToWrite as any)[key];
        }
    });

    await setDoc(leadRef, dataToWrite);

    await logActivity({
        userId: adminUser.id,
        userName: adminUser.name,
        userEmail: adminUser.email,
        role: "Admin",
        activity: "Lead Created",
        details: { 
            leadId: newLead.id,
            leadName: newLead.name,
            amount: newLead.helpRequested,
            purpose: newLead.purpose
        }
    });

    return newLead;

  } catch (error) {
    console.error('Error creating lead in Firestore: ', error);
    if (error instanceof Error) {
        if (error.message.includes('UserKey')) {
            throw new Error(`Failed to create lead: ${error.message}. Possible fix: Go to the user's profile and ensure their 'User Key' field is populated, or contact a Super Admin.`);
        }
         if (error.message.includes('permission-denied')) {
             throw new Error("Failed to create lead: Firestore permission denied. Please check server logs and IAM permissions.");
        }
        throw new Error(`Failed to create lead: ${error.message}`);
    }
    throw new Error('An unknown error occurred while creating the lead.');
  }
};

// Function to get a lead by ID
export const getLead = async (id: string): Promise<Lead | null> => {
  if (!id) return null;
  try {
    const leadDoc = await getDoc(doc(db, LEADS_COLLECTION, id));
    if (leadDoc.exists()) {
      const data = leadDoc.data();
      const beneficiary = await getUser(data.beneficiaryId);
      // Manually convert Timestamps to Dates for client-side compatibility
      return { 
        id: leadDoc.id, 
        ...data,
        beneficiary: beneficiary || undefined,
        dateCreated: data.dateCreated ? (data.dateCreated as Timestamp).toDate() : new Date(),
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
        closedAt: data.closedAt ? (data.closedAt as Timestamp).toDate() : undefined,
        dueDate: data.dueDate ? (data.dueDate as any).toDate() : undefined,
        caseReportedDate: data.caseReportedDate ? (data.caseReportedDate as Timestamp).toDate() : undefined,
        verificationDueDate: data.verificationDueDate ? (data.verificationDueDate as any).toDate() : undefined,
        verifiers: (data.verifiers || []).map((v: Verifier) => ({...v, verifiedAt: (v.verifiedAt as Timestamp).toDate() })),
        donations: (data.donations || []).map((d: LeadDonationAllocation) => ({...d, allocatedAt: (d.allocatedAt as Timestamp).toDate() })),
        fundTransfers: (data.fundTransfers || []).map((t: FundTransfer) => ({...t, transferredAt: (t.transferredAt as Timestamp).toDate() })),
      } as Lead;
    }
    return null;
  } catch (error) {
    console.error(`Error getting lead with ID ${id}:`, error);
    return null;
  }
};

// Function to update a lead
export const updateLead = async (id: string, updates: Partial<Omit<Lead, 'id' | 'createdAt'>>) => {
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
    if (error instanceof Error) {
        // Return the specific Firestore error message
        throw new Error(error.message);
    }
    throw new Error('An unknown error occurred while updating the lead.');
  }
};

// Function to delete a lead
export const deleteLead = async (id: string, adminUser: Pick<User, 'id' | 'name' | 'email'>) => {
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

    await updateLead(id, { caseStatus: newStatus });
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
    
    await updateLead(id, updates);
};


// Function to get all leads
export const getAllLeads = async (): Promise<Lead[]> => {
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
              updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
              closedAt: data.closedAt ? (data.closedAt as Timestamp).toDate() : undefined,
              dueDate: data.dueDate ? (data.dueDate as any).toDate() : undefined,
              caseReportedDate: data.caseReportedDate ? (data.caseReportedDate as Timestamp).toDate() : undefined,
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
    if (!beneficiaryId) return [];
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
                 dateCreated: data.dateCreated ? (data.dateCreated as Timestamp).toDate() : new Date(),
            } as Lead);
        });
        // Sort in memory instead of in the query
        leads.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
        return leads;
    } catch (error) {
        console.error("Error fetching beneficiary leads:", error);
         if (error instanceof Error && error.message.includes('requires an index')) {
            const detailedError = `Firestore query error. This typically indicates a missing index. Try creating a single-field index on 'beneficiaryId' in the 'leads' collection. Full error: ${detailedError}`;
            console.error(detailedError);
            return []; // Return empty array to prevent crash
        }
        return []; // Return empty array on other errors
    }
}

// Function to get leads by campaignId
export const getLeadsByCampaignId = async (campaignId: string): Promise<Lead[]> => {
    try {
        const leadsQuery = query(
            collection(db, LEADS_COLLECTION), 
            where("campaignId", "==", campaignId)
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
        // Sort in memory to avoid needing a composite index
        leads.sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime());
        return leads;
    } catch (error) {
        console.error("Error fetching campaign leads: ", error);
        if (error instanceof Error && error.message.includes('index')) {
             console.error("Firestore index missing. Please create a composite index in Firestore on the 'leads' collection for 'campaignId' (ascending) and 'dateCreated' (descending).");
        }
        return [];
    }
};

// Function to get open leads for a specific beneficiary
export const getOpenLeadsByBeneficiaryId = async (beneficiaryId: string): Promise<Lead[]> => {
    if (!beneficiaryId) return [];
    try {
        const leadsQuery = query(
            collection(db, LEADS_COLLECTION),
            where("beneficiaryId", "==", beneficiaryId),
            where("caseStatus", "in", ["Pending", "Partial", "Open"])
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
        return [];
    }
}

export const getAllCampaigns = async (): Promise<Campaign[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'campaigns'));
        const campaigns: Campaign[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            campaigns.push({
                id: doc.id,
                ...data,
                startDate: (data.startDate as Timestamp).toDate(),
                endDate: (data.endDate as Timestamp).toDate(),
            } as Campaign);
        });
        return campaigns;
    } catch (error) {
        console.error('Error fetching all campaigns for lead form: ', error);
        return [];
    }
};
