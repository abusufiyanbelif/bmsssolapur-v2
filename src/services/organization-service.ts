
/**
 * @fileOverview Service for managing organization data in Firestore.
 */

import { doc, getDoc, setDoc, updateDoc, collection, limit, query, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from './firebase'; // Use client-side SDK for updates from client components/actions
import type { Organization, OrganizationFooter } from './types';
import { getAdminDb } from './firebase-admin';


// Re-export types for backward compatibility
export type { Organization, OrganizationFooter };

const ORGANIZATIONS_COLLECTION = 'organizations';
const PUBLIC_DATA_COLLECTION = 'publicData';


// Function to check for duplicate organizations
const checkDuplicates = async (name: string, registrationNumber: string): Promise<boolean> => {
    const adminDb = await getAdminDb();
    const nameQuery = query(collection(adminDb, ORGANIZATIONS_COLLECTION), where("name", "==", name), limit(1));
    const regQuery = query(collection(adminDb, ORGANIZATIONS_COLLECTION), where("registrationNumber", "==", registrationNumber), limit(1));

    const [nameSnapshot, regSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(regQuery)
    ]);

    return !nameSnapshot.empty || !regSnapshot.empty;
}


// Function to create an organization
export const createOrganization = async (orgData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>) => {
  const adminDb = await getAdminDb();
  try {
    const isDuplicate = await checkDuplicates(orgData.name, orgData.registrationNumber);
    if (isDuplicate) {
        throw new Error("An organization with the same name or registration number already exists.");
    }

    const orgRef = doc(collection(adminDb, ORGANIZATIONS_COLLECTION));
    const newOrganization: Organization = {
      ...orgData,
      id: orgRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await setDoc(orgRef, newOrganization);

    // Sync with public collection
    // await updatePublicOrganization(newOrganization); // This must be called from a server context

    return newOrganization;
  } catch (error) {
    console.error('Error creating organization: ', error);
    throw error;
  }
};

// Function to get an organization by ID
export const getOrganization = async (id: string): Promise<Organization | null> => {
  try {
    const adminDb = await getAdminDb();
    const orgDoc = await getDoc(doc(adminDb, ORGANIZATIONS_COLLECTION, id));
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

// Function to update an organization
export const updateOrganization = async (id: string, updates: Partial<Omit<Organization, 'id' | 'createdAt'>>) => {
  try {
    const adminDb = await getAdminDb();
    const orgRef = doc(adminDb, ORGANIZATIONS_COLLECTION, id);
    await updateDoc(orgRef, {
        ...updates,
        updatedAt: new Date(),
    });

    // After updating, get the full document and sync it to the public collection
    const updatedOrg = await getOrganization(id);
    if (updatedOrg) {
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
        const adminDb = await getAdminDb();
        const orgRef = doc(adminDb, ORGANIZATIONS_COLLECTION, id);
        await updateDoc(orgRef, {
            footer: footerData,
            updatedAt: new Date(),
        });
    } catch (error) {
        console.error("Error updating organization footer: ", error);
        throw new Error('Failed to update organization footer.');
    }
};

/**
 * Converts a gs:// URI to a public https:// firebasestorage URL.
 * @param gsUri The gs:// URI.
 * @returns The corresponding https:// URL or the original string if it's not a gs:// URI.
 */
const convertGsToHttps = (gsUri?: string): string | undefined => {
    if (!gsUri || !gsUri.startsWith('gs://')) {
        return gsUri;
    }
    // Example: gs://baitul-mal-connect.appspot.com/app-assets/logo-new.png
    const path = gsUri.substring(5); // Remove "gs://"
    const bucket = path.substring(0, path.indexOf('/'));
    const objectPath = path.substring(path.indexOf('/') + 1);
    
    // The public URL format for Firebase Storage
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
};


// For now, we will assume one organization for simplicity. This can be expanded later.
export const getCurrentOrganization = async (): Promise<Organization | null> => {
    try {
        const adminDb = await getAdminDb();
        const orgQuery = query(adminDb.collection(ORGANIZATIONS_COLLECTION), limit(1));
        const querySnapshot = await getDocs(orgQuery);
        if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            const data = docSnap.data();

            // Convert gs:// URIs to https:// URLs before returning
            const organizationData = {
                id: docSnap.id, 
                ...data,
                logoUrl: convertGsToHttps(data.logoUrl),
                qrCodeUrl: convertGsToHttps(data.qrCodeUrl),
                createdAt: (data.createdAt as Timestamp)?.toDate(),
                updatedAt: (data.updatedAt as Timestamp)?.toDate(),
            } as Organization;
            
            return organizationData;
        }
        return null;
    } catch (error) {
        if (error instanceof Error && (error.message.includes('Could not load the default credentials') || error.message.includes('Could not refresh access token') || error.message.includes('permission-denied'))) {
            console.warn("Firestore permission error in getCurrentOrganization. This may be an expected error if the database has not been seeded yet. Please check IAM roles. Returning null.");
            return null; 
        }
        console.error('Error getting current organization: ' + (error instanceof Error ? error.message : 'Unknown error'));
        return null;
    }
}
