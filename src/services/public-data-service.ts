
/**
 * @fileOverview Service for managing public-facing, sanitized data in Firestore.
 */

import { getAdminDb } from './firebase-admin';
import type { Lead, Organization, Campaign, PublicStats, User } from './types';
import { getUser } from './user-service';
import { getLeadsByCampaignId } from './lead-service';


const PUBLIC_LEADS_COLLECTION = 'publicLeads';
const PUBLIC_CAMPAIGNS_COLLECTION = 'publicCampaigns';
const PUBLIC_DATA_COLLECTION = 'publicData';

/**
 * Updates a public-facing lead document. If the lead is not meant for public
 * display (e.g., status is not 'Publish'), it deletes the public doc.
 * @param lead - The full lead object from the private collection.
 */
export const updatePublicLead = async (lead: Lead): Promise<void> => {
  const adminDb = getAdminDb();
  const publicLeadRef = adminDb.collection(PUBLIC_LEADS_COLLECTION).doc(lead.id);

  if (lead.caseAction !== 'Publish') {
    // If the lead is no longer public, delete its public record
    await publicLeadRef.delete().catch(() => {}); // Ignore errors if doc doesn't exist
    return;
  }
  
  const beneficiary = await getUser(lead.beneficiaryId);

  // Sanitize the lead data for public consumption
  const publicLeadData = {
    id: lead.id,
    name: lead.name,
    beneficiaryId: lead.beneficiaryId,
    headline: lead.headline,
    story: lead.story,
    purpose: lead.purpose,
    category: lead.category,
    helpRequested: lead.helpRequested,
    helpGiven: lead.helpGiven,
    dateCreated: lead.dateCreated,
    dueDate: lead.dueDate,
    isAnonymous: beneficiary?.isAnonymousAsBeneficiary,
    anonymousId: beneficiary?.anonymousBeneficiaryId,
  };
  await publicLeadRef.set(publicLeadData, { merge: true });
};

/**
 * Updates the public-facing organization profile.
 * @param org - The full organization object.
 */
export const updatePublicOrganization = async (org: Organization): Promise<void> => {
  const adminDb = getAdminDb();
  const publicOrgRef = adminDb.collection(PUBLIC_DATA_COLLECTION).doc('organization');
  await publicOrgRef.set(org);
};


/**
 * Fetches all publicly visible leads.
 * @returns An array of sanitized public lead objects.
 */
export const getPublicLeads = async (): Promise<Lead[]> => {
    const adminDb = getAdminDb();
    try {
        const q = adminDb.collection(PUBLIC_LEADS_COLLECTION).orderBy("dateCreated", "desc");
        const snapshot = await q.get();
        const leads = snapshot.docs.map(doc => doc.data() as Lead);
        
        // Enrich with beneficiary info
        const enrichedLeads = await Promise.all(leads.map(async (lead) => {
            const beneficiary = await getUser(lead.beneficiaryId);
            return { ...lead, beneficiary };
        }));

        return enrichedLeads;
    } catch (e) {
        console.error("Error fetching public leads:", e);
        if (e instanceof Error && e.message.includes('index')) {
            console.error("Firestore index missing. Please create a descending index on 'dateCreated' for the 'publicLeads' collection.");
        }
        return [];
    }
};

/**
 * Fetches the public organization profile.
 * @returns The public organization object or null if not found.
 */
export const getPublicOrganization = async (): Promise<Organization | null> => {
    const adminDb = getAdminDb();
    const publicOrgRef = adminDb.collection(PUBLIC_DATA_COLLECTION).doc('organization');
    const docSnap = await publicOrgRef.get();
    return docSnap.exists ? (docSnap.data() as Organization) : null;
};

/**
 * Updates the public statistics document.
 * @param stats - The stats object to save.
 */
export const updatePublicStats = async (stats: PublicStats): Promise<void> => {
    const adminDb = getAdminDb();
    const publicStatsRef = adminDb.collection(PUBLIC_DATA_COLLECTION).doc('stats');
    await publicStatsRef.set(stats, { merge: true });
};

/**
 * Fetches the public statistics.
 * @returns The public stats object or null.
 */
export const getPublicStats = async (): Promise<PublicStats | null> => {
    const adminDb = getAdminDb();
    const publicStatsRef = adminDb.collection(PUBLIC_DATA_COLLECTION).doc('stats');
    const docSnap = await publicStatsRef.get();
    return docSnap.exists() ? (docSnap.data() as PublicStats) : null;
};

/**
 * Updates a public-facing campaign document.
 * @param campaign - The full campaign object with calculated stats.
 */
export const updatePublicCampaign = async (campaign: Campaign & { raisedAmount: number; fundingProgress: number; }): Promise<void> => {
    const adminDb = getAdminDb();
    const publicCampaignRef = adminDb.collection(PUBLIC_CAMPAIGNS_COLLECTION).doc(campaign.id!);

     if (campaign.status === 'Cancelled') {
        await publicCampaignRef.delete().catch(() => {});
        return;
    }

    await publicCampaignRef.set(campaign, { merge: true });
};

/**
 * Fetches all public campaigns.
 * @returns An array of public campaign objects.
 */
export const getPublicCampaigns = async (): Promise<(Campaign & { raisedAmount: number, fundingProgress: number })[]> => {
    const adminDb = getAdminDb();
    try {
        const q = adminDb.collection(PUBLIC_CAMPAIGNS_COLLECTION).orderBy("startDate", "desc");
        const snapshot = await q.get();
        return snapshot.docs.map(doc => doc.data() as (Campaign & { raisedAmount: number, fundingProgress: number }));
    } catch (e) {
        console.error("Error fetching public campaigns:", e);
        if (e instanceof Error && e.message.includes('index')) {
            console.error("Firestore index missing. Please create a descending index on 'startDate' for the 'publicCampaigns' collection.");
        }
        return [];
    }
};

/**
 * Enriches a campaign with its public-facing statistics.
 * @param campaign The campaign object to enrich.
 * @returns The enriched campaign object.
 */
export const enrichCampaignWithPublicStats = async (campaign: Campaign): Promise<Campaign & { raisedAmount: number; fundingProgress: number; }> => {
    const linkedLeads = await getLeadsByCampaignId(campaign.id!);
    const raisedAmount = linkedLeads.reduce((sum, lead) => sum + lead.helpGiven, 0);
    const fundingProgress = campaign.goal > 0 ? (raisedAmount / campaign.goal) * 100 : 0;
    
    return {
        ...campaign,
        raisedAmount,
        fundingProgress,
    };
}
