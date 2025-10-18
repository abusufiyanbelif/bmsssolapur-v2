
/**
 * @fileOverview Service for managing organization data in Firestore.
 */

import { getFirestore as getAdminFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { Organization, OrganizationFooter } from './types';
import { getAdminDb } from './firebase-admin';
import { unstable_noStore as noStore } from 'next/cache';


// Re-export types for backward compatibility
export type { Organization, OrganizationFooter };

const ORGANIZATIONS_COLLECTION = 'organizations';
const PUBLIC_DATA_COLLECTION = 'publicData';

// Function to check for duplicate organizations
const checkDuplicates = async (name: string, registrationNumber: string): Promise<boolean> => {
    const adminDb = await getAdminDb();
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
  const adminDb = await getAdminDb();
  try {
    const isDuplicate = await checkDuplicates(orgData.name, orgData.registrationNumber);
    if (isDuplicate) {
        throw new Error("An organization with the same name or registration number already exists.");
    }

    const orgRef = adminDb.collection(ORGANIZATIONS_COLLECTION).doc('main_org'); // Use a singleton document
    const newOrganization: Omit<Organization, 'id'> = {
      ...orgData,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: { id: 'SYSTEM', name: 'System Seed' }
    };
    await orgRef.set(newOrganization);

    return { id: orgRef.id, ...newOrganization } as Organization;
  } catch (error) {
    console.error('Error creating organization: ', error);
    throw error;
  }
};

// Function to get an organization by ID
export const getOrganization = async (id: string): Promise<Organization | null> => {
  if (!id) return null;
  try {
    const adminDb = await getAdminDb();
    const orgDoc = await adminDb.collection(ORGANIZATIONS_COLLECTION).doc(id).get();
    if (orgDoc.exists) {
      const data = orgDoc.data();
      return { 
        id: orgDoc.id, 
        ...data,
        createdAt: (data!.createdAt as Timestamp)?.toDate(),
        updatedAt: (data!.updatedAt as Timestamp)?.toDate(),
       } as Organization;
    }
    return null;
  } catch (error) {
    console.error(`Error getting organization with ID ${id}:`, error);
    if (error instanceof Error) {
        // Return null instead of throwing to prevent page crashes
        return null;
    }
    return null;
  }
};

// Function to update an organization
export const updateOrganization = async (id: string, updates: Partial<Omit<Organization, 'id' | 'createdAt'>>) => {
  try {
    const adminDb = await getAdminDb();
    const orgRef = adminDb.collection(ORGANIZATIONS_COLLECTION).doc(id);
    await orgRef.update({
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating organization: ", error);
    throw new Error('Failed to update organization.');
  }
};

export const updateOrganizationFooter = async (id: string, footerData: OrganizationFooter, updatedBy: {id: string, name: string}) => {
    try {
        const adminDb = await getAdminDb();
        const orgRef = adminDb.collection(ORGANIZATIONS_COLLECTION).doc(id);
        await orgRef.update({
            footer: footerData,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: updatedBy,
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

// This function is now DEPRECATED as it has been moved to a server action.
// It is kept here to avoid breaking any potential remaining direct imports temporarily,
// but all usage should be migrated to `src/app/admin/settings/actions.ts`.
// @deprecated
export const getCurrentOrganization = async (): Promise<Organization | null> => {
    noStore(); // Opt out of caching for this specific function.
    
    try {
        const adminDb = await getAdminDb();
        const orgQuery = adminDb.collection(ORGANIZATIONS_COLLECTION).limit(1);
        const querySnapshot = await orgQuery.get();
        
        const docSnap = querySnapshot.docs.find(doc => doc.id !== '_init_');

        if (!docSnap || !docSnap.exists) {
            console.log("No organization document found, returning null.");
            return null;
        }
        
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
    } catch (error) {
        // Return null instead of throwing an error to prevent page crashes.
        const err = error instanceof Error ? error : new Error('Unknown error in getCurrentOrganization');
        console.warn('Warning: Could not get current organization. ' + err.message);
        return null;
    }
}
