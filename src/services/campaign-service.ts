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
  orderBy,
  where,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import type { Campaign, CampaignStatus, Lead } from './types';
import { getLeadsByCampaignId } from './lead-service';
import { updatePublicCampaign } from './public-data-service';

export type { Campaign, CampaignStatus };

const CAMPAIGNS_COLLECTION = 'campaigns';

/**
 * Creates a new campaign.
 * @param campaignData - The data for the new campaign.
 * @returns The newly created campaign object.
 */
export const createCampaign = async (campaignData: Partial<Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Campaign> => {
  try {
    const campaignId = campaignData.id || campaignData.name!.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Check for duplicates before writing
    const q = query(collection(db, CAMPAIGNS_COLLECTION), where("name", "==", campaignData.name), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error(`A campaign with the name "${campaignData.name}" already exists.`);
    }

    const campaignRef = doc(db, CAMPAIGNS_COLLECTION, campaignId);
    
    const newCampaignData: Partial<Campaign> = {
      ...campaignData,
      id: campaignRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Firestore does not accept 'undefined' values.
    // We must clean the object before sending it.
    Object.keys(newCampaignData).forEach(key => {
        const typedKey = key as keyof Campaign;
        if (newCampaignData[typedKey] === undefined) {
            delete (newCampaignData as any)[typedKey];
        }
    });
    
    await setDoc(campaignRef, newCampaignData);
    
    // We fetch the document again to get the server-generated timestamps as Date objects
    const newDoc = await getDoc(campaignRef);
    const data = newDoc.data();
    if (!data) {
        throw new Error('Failed to create campaign, document not found after creation.');
    }
    
    const finalCampaign = { 
        ...data,
        id: newDoc.id,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: (data.endDate as Timestamp).toDate(),
    } as Campaign;

    return finalCampaign;

  } catch (error) {
    console.error('Error creating campaign: ', error);
    if (error instanceof Error) {
        // Re-throw the specific error to be caught by the server action
        throw error;
    }
    throw new Error('An unknown error occurred while creating the campaign.');
  }
};

/**
 * Retrieves a single campaign by its ID.
 * @param id - The ID of the campaign to retrieve.
 * @returns The campaign object or null if not found.
 */
export const getCampaign = async (id: string): Promise<Campaign | null> => {
  if (!id) return null;
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
    console.error(`Error getting campaign with id ${id}: `, error);
    return null;
  }
};

/**
 * Retrieves all campaigns from the database.
 * @returns An array of campaign objects.
 */
export const getAllCampaigns = async (): Promise<Campaign[]> => {
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
    // Gracefully handle missing index error without crashing
    if (error instanceof Error && error.message.includes('index')) {
        console.error("Firestore index missing. Please create a descending index on 'startDate' for the 'campaigns' collection. Retrying without ordering.");
        // Retry without ordering if index is missing
        try {
            const campaignsQuery = query(collection(db, CAMPAIGNS_COLLECTION));
            const querySnapshot = await getDocs(campaignsQuery);
            const campaigns: Campaign[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                campaigns.push({
                    id: doc.id, ...data, startDate: (data.startDate as Timestamp).toDate(),
                    endDate: (data.endDate as Timestamp).toDate(), createdAt: (data.createdAt as Timestamp).toDate(),
                    updatedAt: (data.updatedAt as Timestamp).toDate(),
                } as Campaign);
            });
            return campaigns;
        } catch (retryError) {
             console.error("Retry failed for getAllCampaigns:", retryError);
             return [];
        }
    }
    return []; // Return empty array on other errors
  }
};

/**
 * Updates an existing campaign.
 * @param id - The ID of the campaign to update.
 * @param updates - An object with the fields to update.
 */
export const updateCampaign = async (id: string, updates: Partial<Omit<Campaign, 'id' | 'createdAt'>>): Promise<void> => {
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
  try {
    const campaignRef = doc(db, CAMPAIGNS_COLLECTION, id);
    await deleteDoc(campaignRef);
  } catch (error) {
    console.error("Error deleting campaign: ", error);
    throw new Error('Failed to delete campaign.');
  }
};
