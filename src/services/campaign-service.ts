

/**
 * @fileOverview Campaign service for interacting with Firestore.
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
  orderBy
} from 'firebase/firestore';
import { db, isConfigValid } from './firebase';
import type { Campaign, CampaignStatus } from './types';

export type { Campaign, CampaignStatus };

const CAMPAIGNS_COLLECTION = 'campaigns';

/**
 * Creates a new campaign.
 * @param campaignData - The data for the new campaign.
 * @returns The newly created campaign object.
 */
export const createCampaign = async (campaignData: Omit<Campaign, 'createdAt' | 'updatedAt'>): Promise<Campaign> => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    const campaignId = campaignData.id || campaignData.name.toLowerCase().replace(/\s+/g, '-');
    const campaignRef = doc(db, CAMPAIGNS_COLLECTION, campaignId);
    
    const newCampaign: Campaign = {
      ...campaignData,
      id: campaignRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await setDoc(campaignRef, newCampaign);
    return newCampaign;
  } catch (error) {
    console.error('Error creating campaign: ', error);
    throw new Error('Failed to create campaign.');
  }
};

/**
 * Retrieves a single campaign by its ID.
 * @param id - The ID of the campaign to retrieve.
 * @returns The campaign object or null if not found.
 */
export const getCampaign = async (id: string): Promise<Campaign | null> => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    const campaignDoc = await getDoc(doc(db, CAMPAIGNS_COLLECTION, id));
    if (campaignDoc.exists()) {
      const data = campaignDoc.data();
      // Manually convert Timestamps to Dates
      const campaign: Campaign = {
        id: campaignDoc.id,
        ...data,
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: (data.endDate as Timestamp).toDate(),
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
      } as Campaign;
      return campaign;
    }
    return null;
  } catch (error) {
    console.error('Error getting campaign: ', error);
    throw new Error('Failed to get campaign.');
  }
};

/**
 * Retrieves all campaigns from the database.
 * @returns An array of campaign objects.
 */
export const getAllCampaigns = async (): Promise<Campaign[]> => {
  if (!isConfigValid) {
    console.warn("Firebase not configured. Returning empty array for campaigns.");
    return [];
  }
  try {
    const campaignsQuery = query(collection(db, CAMPAIGNS_COLLECTION), orderBy("startDate", "desc"));
    const querySnapshot = await getDocs(campaignsQuery);
    const campaigns: Campaign[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Manually convert Timestamps to Dates before sending to client
       const campaign: Campaign = {
        id: doc.id,
        ...data,
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: (data.endDate as Timestamp).toDate(),
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
      } as Campaign;
      campaigns.push(campaign);
    });
    return campaigns;
  } catch (error) {
    console.error("Error getting all campaigns: ", error);
    throw new Error('Failed to get all campaigns.');
  }
};

/**
 * Updates an existing campaign.
 * @param id - The ID of the campaign to update.
 * @param updates - An object with the fields to update.
 */
export const updateCampaign = async (id: string, updates: Partial<Omit<Campaign, 'id' | 'createdAt'>>): Promise<void> => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    const campaignRef = doc(db, CAMPAIGNS_COLLECTION, id);
    await updateDoc(campaignRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating campaign: ", error);
    throw new Error('Failed to update campaign.');
  }
};

/**
 * Deletes a campaign from the database.
 * @param id - The ID of the campaign to delete.
 */
export const deleteCampaign = async (id: string): Promise<void> => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    await deleteDoc(doc(db, CAMPAIGNS_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting campaign: ", error);
    throw new Error('Failed to delete campaign.');
  }
};
