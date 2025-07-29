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
} from 'firebase/firestore';
import { db } from './firebase';
import { DonationType } from './donation-service';

const LEADS_COLLECTION = 'leads';

export type LeadStatus = 'Pending' | 'Partially Closed' | 'Closed';

export interface Lead {
  id?: string;
  name: string; // Can be "Anonymous"
  helpRequested: number;
  helpGiven: number;
  category: DonationType;
  status: LeadStatus;
  dateHelped: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Function to create a lead
export const createLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'helpGiven' | 'status'>) => {
  try {
    const leadRef = doc(collection(db, LEADS_COLLECTION));
    const newLead: Omit<Lead, 'id'> & { id: string } = {
      ...leadData,
      id: leadRef.id,
      helpGiven: 0,
      status: 'Pending',
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
    try {
        await deleteDoc(doc(db, LEADS_COLLECTION, id));
    } catch (error) {
        console.error("Error deleting lead: ", error);
        throw new Error('Failed to delete lead.');
    }
}

// Function to get all leads
export const getAllLeads = async (): Promise<Lead[]> => {
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
