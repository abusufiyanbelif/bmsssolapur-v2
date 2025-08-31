

/**
 * @fileOverview Service for managing public-facing, sanitized data in Firestore.
 */

import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { db, isConfigValid } from './firebase';
import type { Lead, Organization, Campaign, PublicStats } from './types';

const PUBLIC_LEADS_COLLECTION = 'publicLeads';
const PUBLIC_CAMPAIGNS_COLLECTION = 'publicCampaigns';
const PUBLIC_DATA_COLLECTION = 'publicData';

/**
 * Updates a public-facing lead document. If the lead is not meant for public
 * display (e.g., status is not 'Publish'), it deletes the public doc.
 * @param lead - The full lead object from the private collection.
 */
export const updatePublicLead = async (lead: Lead): Promise<void> => {
  if (!isConfigValid) return;
  const publicLeadRef = doc(db, PUBLIC_LEADS_COLLECTION, lead.id);

  if (lead.caseAction !== 'Publish') {
    // If the lead is no longer public, delete its public record
    await deleteDoc(publicLeadRef).catch(() => {}); // Ignore errors if doc doesn't exist
    return;
  }

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
    isAnonymous: lead.beneficiary?.isAnonymousAsBeneficiary,
    anonymousId: lead.beneficiary?.anonymousBeneficiaryId,
  };
  await setDoc(publicLeadRef, publicLeadData, { merge: true });
};

/**
 * Updates the public-facing organization profile.
 * @param org - The full organization object.
 */
export const updatePublicOrganization = async (org: Organization): Promise<void> => {
  if (!isConfigValid) return;
  const publicOrgRef = doc(db, PUBLIC_DATA_COLLECTION, 'organization');
  await setDoc(publicOrgRef, org);
};


/**
 * Fetches all publicly visible leads.
 * @returns An array of sanitized public lead objects.
 */
export const getPublicLeads = async (): Promise<Lead[]> => {
    if (!isConfigValid) return [];
    try {
        const q = query(collection(db, PUBLIC_LEADS_COLLECTION), orderBy("dateCreated", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Lead);
    } catch (e) {
        console.error("Error fetching public leads:", e);
        return [];
    }
};

/**
 * Fetches the public organization profile.
 * @returns The public organization object or null if not found.
 */
export const getPublicOrganization = async (): Promise<Organization | null> => {
    if (!isConfigValid) return null;
    const publicOrgRef = doc(db, PUBLIC_DATA_COLLECTION, 'organization');
    const docSnap = await getDoc(publicOrgRef);
    return docSnap.exists() ? (docSnap.data() as Organization) : null;
};

/**
 * Updates the public statistics document.
 * @param stats - The stats object to save.
 */
export const updatePublicStats = async (stats: PublicStats): Promise<void> => {
    if (!isConfigValid) return;
    const publicStatsRef = doc(db, PUBLIC_DATA_COLLECTION, 'stats');
    await setDoc(publicStatsRef, stats, { merge: true });
};

/**
 * Fetches the public statistics.
 * @returns The public stats object or null.
 */
export const getPublicStats = async (): Promise<PublicStats | null> => {
    if (!isConfigValid) return null;
    const publicStatsRef = doc(db, PUBLIC_DATA_COLLECTION, 'stats');
    const docSnap = await getDoc(publicStatsRef);
    return docSnap.exists() ? (docSnap.data() as PublicStats) : null;
};

/**
 * Updates a public-facing campaign document.
 * @param campaign - The full campaign object.
 */
export const updatePublicCampaign = async (campaign: Campaign & { raisedAmount: number; fundingProgress: number; }): Promise<void> => {
    if (!isConfigValid) return;
    const publicCampaignRef = doc(db, PUBLIC_CAMPAIGNS_COLLECTION, campaign.id);
    await setDoc(publicCampaignRef, campaign, { merge: true });
};

/**
 * Fetches all public campaigns.
 * @returns An array of public campaign objects.
 */
export const getPublicCampaigns = async (): Promise<(Campaign & { raisedAmount: number, fundingProgress: number })[]> => {
    if (!isConfigValid) return [];
    try {
        const q = query(collection(db, PUBLIC_CAMPAIGNS_COLLECTION), orderBy("startDate", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as (Campaign & { raisedAmount: number, fundingProgress: number }));
    } catch (e) {
        console.error("Error fetching public campaigns:", e);
        return [];
    }
};
