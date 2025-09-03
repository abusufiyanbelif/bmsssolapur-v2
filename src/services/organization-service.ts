/**
 * @fileOverview Service for managing organization data in Firestore.
 */

import { doc, getDoc, setDoc, updateDoc, collection, limit, query, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from './firebase'; // Use client-side SDK
import type { Organization, OrganizationFooter } from './types';
import { updatePublicOrganization } from './public-data-service';


// Re-export types for backward compatibility
export type { Organization };

const ORGANIZATIONS_COLLECTION = 'organizations';
const PUBLIC_DATA_COLLECTION = 'publicData';


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
    const orgDoc = await getDoc(doc(db, ORGANIZATIONS_COLLECTION, id));
    if (orgDoc.exists()) {
      const data = orgDoc.data();
      return { 
        id: orgDoc.id, 
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate(),
       } as Organization;
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
        const orgQuery = query(collection(db, ORGANIZATIONS_COLLECTION), limit(1));
        const querySnapshot = await getDocs(orgQuery);
        if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            const data = docSnap.data();
            return { 
                id: docSnap.id, 
                ...data,
                createdAt: (data.createdAt as Timestamp)?.toDate(),
                updatedAt: (data.updatedAt as Timestamp)?.toDate(),
            } as Organization;
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
    const orgRef = doc(db, ORGANIZATIONS_COLLECTION, id);
    await updateDoc(orgRef, {
        ...updates,
        updatedAt: new Date(),
    });

    // After updating, get the full document and sync it to the public collection
    const updatedOrg = await getOrganization(id);
    if (updatedOrg) {
        // This function uses firebase-admin, so it can only be called from a server context.
        // The calling server action is responsible for this.
        // await updatePublicOrganization(updatedOrg);
    }
  } catch (error) {
    console.error("Error updating organization: ", error);
    throw new Error('Failed to update organization.');
  }
};

export const updateOrganizationFooter = async (id: string, footerData: OrganizationFooter) => {
    try {
        const orgRef = doc(db, ORGANIZATIONS_COLLECTION, id);
        await updateDoc(orgRef, {
            footer: footerData,
            updatedAt: new Date(),
        });
    } catch (error) {
        console.error("Error updating organization footer: ", error);
        throw new Error('Failed to update organization footer.');
    }
};
