/**
 * @fileOverview Service for managing organization data in Firestore.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  getDocs,
  where,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';

const ORGANIZATIONS_COLLECTION = 'organizations';

export interface Organization {
  id?: string;
  name: string;
  city: string;
  address: string;
  registrationNumber: string;
  aadhaarNumber?: string;
  panNumber?: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Function to check for duplicate organizations
const checkDuplicates = async (name: string, registrationNumber: string): Promise<boolean> => {
    const nameQuery = query(collection(db, ORGANIZATIONS_COLLECTION), where("name", "==", name), limit(1));
    const regQuery = query(collection(db, ORGANIZATIONS_COLLECTION), where("registrationNumber", "==", registrationNumber), limit(1));

    const [nameSnapshot, regSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(regQuery)
    ]);

    return !nameSnapshot.empty || !regSnapshot.empty;
}


// Function to create an organization
export const createOrganization = async (orgData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const isDuplicate = await checkDuplicates(orgData.name, orgData.registrationNumber);
    if (isDuplicate) {
        throw new Error("An organization with the same name or registration number already exists.");
    }

    const orgRef = doc(collection(db, ORGANIZATIONS_COLLECTION));
    const newOrganization: Organization = {
      ...orgData,
      id: orgRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await setDoc(orgRef, newOrganization);
    return newOrganization;
  } catch (error) {
    console.error('Error creating organization: ', error);
    throw error;
  }
};

// Function to get an organization by ID
export const getOrganization = async (id: string): Promise<Organization | null> => {
  try {
    const orgDoc = await getDoc(doc(db, ORGANIZATIONS_COLLECTION, id));
    if (orgDoc.exists()) {
      return { id: orgDoc.id, ...orgDoc.data() } as Organization;
    }
    return null;
  } catch (error) {
    console.error('Error getting organization: ', error);
    throw new Error('Failed to get organization.');
  }
};

// For now, we will assume one organization for simplicity. This can be expanded later.
export const getCurrentOrganization = async (): Promise<Organization | null> => {
    try {
        const orgQuery = query(collection(db, ORGANIZATIONS_COLLECTION), limit(1));
        const querySnapshot = await getDocs(orgQuery);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Organization;
        }
        return null;
    } catch (error) {
        console.error('Error getting current organization: ', error);
        throw new Error('Failed to get current organization.');
    }
}


// Function to update an organization
export const updateOrganization = async (id: string, updates: Partial<Omit<Organization, 'id' | 'createdAt'>>) => {
  try {
    const orgRef = doc(db, ORGANIZATIONS_COLLECTION, id);
    await updateDoc(orgRef, {
        ...updates,
        updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating organization: ", error);
    throw new Error('Failed to update organization.');
  }
};
