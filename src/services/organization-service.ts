/**
 * @fileOverview Service for managing organization data in Firestore.
 */

import { adminDb } from './firebase-admin';
import type { Organization } from './types';
import { updatePublicOrganization } from './public-data-service';


// Re-export types for backward compatibility
export type { Organization };

const ORGANIZATIONS_COLLECTION = 'organizations';

// Function to check for duplicate organizations
const checkDuplicates = async (name: string, registrationNumber: string): Promise<boolean> => {
    const nameQuery = adminDb.collection(ORGANIZATIONS_COLLECTION).where("name", "==", name).limit(1);
    const regQuery = adminDb.collection(ORGANIZATIONS_COLLECTION).where("registrationNumber", "==", registrationNumber).limit(1);

    const [nameSnapshot, regSnapshot] = await Promise.all([
        nameQuery.get(),
        regQuery.get()
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

    const orgRef = adminDb.collection(ORGANIZATIONS_COLLECTION).doc();
    const newOrganization: Organization = {
      ...orgData,
      id: orgRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await orgRef.set(newOrganization);

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
  try {
    const orgDoc = await adminDb.collection(ORGANIZATIONS_COLLECTION).doc(id).get();
    if (orgDoc.exists) {
      return { id: orgDoc.id, ...orgDoc.data() } as Organization;
    }
    return null;
  } catch (error) {
    console.error(`Error getting organization with ID ${id}:`, error);
    return null;
  }
};

// For now, we will assume one organization for simplicity. This can be expanded later.
export const getCurrentOrganization = async (): Promise<Organization | null> => {
    try {
        const orgQuery = adminDb.collection(ORGANIZATIONS_COLLECTION).limit(1);
        const querySnapshot = await orgQuery.get();
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Organization;
        }
        return null;
    } catch (error) {
        console.error('Error getting current organization: ', error);
        return null;
    }
}


// Function to update an organization
export const updateOrganization = async (id: string, updates: Partial<Omit<Organization, 'id' | 'createdAt'>>) => {
  try {
    const orgRef = adminDb.collection(ORGANIZATIONS_COLLECTION).doc(id);
    await orgRef.update({
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
