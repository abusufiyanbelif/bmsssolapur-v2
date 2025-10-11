/**
 * @fileOverview Service for managing public-facing, sanitized data in Firestore.
 */

import { getAdminDb } from './firebase-admin';
import type { Lead, Organization, Campaign, PublicStats, User } from './types';
import { getUser } from './user-service';
import { getLeadsByCampaignId } from './lead-service';
import { Timestamp, collection, getDocs as getAdminDocs, orderBy } from 'firebase-admin/firestore'; // aliasing to avoid confusion
import { getDonationsByCampaignId } from './donation-service';


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
        if (e instanceof Error && (e.message.includes('Could not refresh access token') || e.message.includes('permission-denied') || e.message.includes('UNAUTHENTICATED'))) {
            console.warn(`Permission Denied: The server environment lacks permissions to read public leads. Refer to TROUBLESHOOTING.md.`, e);
            return []; // Gracefully fail
        }
        if (e instanceof Error && (e.message.includes('index') || e.message.includes('Could not find a valid index'))) {
            console.error("Firestore index missing for 'publicLeads' on 'dateCreated' (desc). Please create it. Falling back to unsorted data.");
             try {
                const fallbackSnapshot = await adminDb.collection(PUBLIC_LEADS_COLLECTION).get();
                const fallbackLeads = fallbackSnapshot.docs.map(doc => doc.data() as Lead);
                return await Promise.all(fallbackLeads.map(async (lead) => ({ ...lead, beneficiary: await getUser(lead.beneficiaryId) })));
             } catch (fallbackError) {
                 console.error("Fallback query failed for getPublicLeads", fallbackError);
                 return [];
             }
        } else {
             console.error("Error fetching public leads:", e);
        }
        return [];
    }
};

/**
 * Fetches the public organization profile.
 * @returns The public organization object or null if not found.
 */
export const getPublicOrganization = async (): Promise<Organization | null> => {
    try {
        const adminDb = getAdminDb();
        const publicOrgRef = adminDb.collection(PUBLIC_DATA_COLLECTION).doc('organization');
        const docSnap = await publicOrgRef.get();
        return docSnap.exists ? (docSnap.data() as Organization) : null;
    } catch(e) {
        console.error("Error getting public organization:", e);
        return null;
    }
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
 * Updates a public-facing campaign document. If a campaign is not 'Active' or 'Upcoming',
 * it deletes the public doc.
 * @param campaign - The full campaign object with calculated stats.
 * @param forceDelete - If true, will delete the public doc regardless of status.
 */
export const updatePublicCampaign = async (
  campaign: Campaign & { raisedAmount?: number; fundingProgress?: number },
  forceDelete = false
): Promise<void> => {
    const adminDb = getAdminDb();
    const publicCampaignRef = adminDb.collection(PUBLIC_CAMPAIGNS_COLLECTION).doc(campaign.id!);

    const isPublic = ['Active', 'Upcoming'].includes(campaign.status);

    if (forceDelete || !isPublic) {
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
        const campaigns = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                startDate: (data.startDate as Timestamp)?.toDate(),
                endDate: (data.endDate as Timestamp)?.toDate(),
                createdAt: (data.createdAt as Timestamp)?.toDate(),
                updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
            } as (Campaign & { raisedAmount: number, fundingProgress: number });
        });
        return campaigns;
    } catch (e) {
        if (e instanceof Error && (e.message.includes('Could not refresh access token') || e.message.includes('permission-denied') || e.message.includes('UNAUTHENTICATED'))) {
            console.warn(`Permission Denied: The server environment lacks permissions to read public campaigns. Refer to TROUBLESHOOTING.md.`, e);
            return []; // Gracefully fail
        }
        if (e instanceof Error && (e.message.includes('index') || e.message.includes('Could not find a valid index'))) {
            console.error("Firestore index missing for 'publicCampaigns' on 'startDate' (desc). Please create it. Falling back to unsorted data.");
             try {
                const fallbackSnapshot = await adminDb.collection(PUBLIC_CAMPAIGNS_COLLECTION).get();
                 const campaigns = fallbackSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        ...data,
                        startDate: (data.startDate as Timestamp)?.toDate(),
                        endDate: (data.endDate as Timestamp)?.toDate(),
                    } as (Campaign & { raisedAmount: number, fundingProgress: number });
                });
                return campaigns.sort((a,b) => b.startDate.getTime() - a.startDate.getTime());
             } catch (fallbackError) {
                 console.error("Fallback query failed for getPublicCampaigns", fallbackError);
                 return [];
             }
        } else {
            console.error("Error fetching public campaigns:", e);
        }
        return [];
    }
};

/**
 * Enriches a campaign with its public-facing statistics by calculating funds raised from linked leads.
 * @param campaign The campaign object to enrich.
 * @returns The enriched campaign object.
 */
export const enrichCampaignWithPublicStats = async (campaign: Campaign): Promise<Campaign & { raisedAmount: number; fundingProgress: number; }> => {
    // Fetch all donations linked to this campaign.
    const linkedDonations = await getDonationsByCampaignId(campaign.id!);
    const raisedAmount = linkedDonations
        .filter(d => d.status === 'Verified' || d.status === 'Allocated')
        .reduce((sum, d) => sum + d.amount, 0);

    const fundingProgress = campaign.goal > 0 ? (raisedAmount / campaign.goal) * 100 : 0;
    
    return {
        ...campaign,
        collectedAmount: raisedAmount, // Storing calculated amount
        raisedAmount,
        fundingProgress,
    };
}
