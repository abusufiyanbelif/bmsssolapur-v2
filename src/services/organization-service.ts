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
import { db, isConfigValid } from './firebase';
import type { Organization } from './types';
import { updatePublicOrganization } from './public-data-service';


// Re-export types for backward compatibility
export type { Organization };

const ORGANIZATIONS_COLLECTION = 'organizations';

// Function to check for duplicate organizations
const checkDuplicates = async (name: string, registrationNumber: string): Promise<boolean> => {
    if (!isConfigValid) return false;
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
  if (!isConfigValid) throw new Error("Firebase is not configured.");
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

    // Sync with public collection
    await updatePublicOrganization(newOrganization);

    return newOrganization;
  } catch (error) {
    console.error('Error creating organization: ', error);
    throw error;
  }
};

// Function to get an organization by ID
export const getOrganization = async (id: string): Promise<Organization | null> => {
  if (!isConfigValid) throw new Error("Firebase is not configured.");
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
    if (!isConfigValid) {
        console.warn("Firebase not configured, skipping organization fetch.");
        return null;
    }
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
  if (!isConfigValid) throw new Error("Firebase is not configured.");
  try {
    const orgRef = doc(db, ORGANIZATIONS_COLLECTION, id);
    await updateDoc(orgRef, {
        ...updates,
        updatedAt: new Date(),
    });

    // After updating, get the full document and sync it to the public collection
    const updatedOrg = await getOrganization(id);
    if (updatedOrg) {
        await updatePublicOrganization(updatedOrg);
    }
  } catch (error) {
    console.error("Error updating organization: ", error);
    throw new Error('Failed to update organization.');
  }
};
