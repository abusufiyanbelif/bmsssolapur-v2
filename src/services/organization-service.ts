
/**
 * @fileOverview Service for managing organization data in Firestore.
 */

import { getFirestore as getAdminFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { Organization, OrganizationFooter } from './types';
import { getAdminDb } from './firebase-admin';


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

    const orgRef = adminDb.collection(ORGANIZATIONS_COLLECTION).doc();
    const newOrganization: Organization = {
      ...orgData,
      id: orgRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await orgRef.set(newOrganization);

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
    const orgDoc = await adminDb.collection(ORGANIZATIONS_COLLECTION).doc(id).get();
    if (orgDoc.exists()) {
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
        const orgRef = adminDb.collection(ORGANIZATIONS_COLLECTION).doc(id);
        await orgRef.update({
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


// For now, we will assume one organization for this project.
export const getCurrentOrganization = async (): Promise<Organization | null> => {
    let adminDb;
    try {
        adminDb = await getAdminDb();
    } catch (initError) {
        console.warn(`[Graceful Failure] Could not initialize Admin DB in getCurrentOrganization: ${(initError as Error).message}. This may happen if credentials are not set up.`);
        return null;
    }
    
    try {
        const orgQuery = adminDb.collection(ORGANIZATIONS_COLLECTION).limit(1);
        const querySnapshot = await orgQuery.get();
        if (!querySnapshot.empty) {
            // CRITICAL FIX: Explicitly check for and ignore the _init_ document
            const docSnap = querySnapshot.docs[0];
            if (docSnap.id === '_init_') {
                console.log("Only found _init_ document in organizations. Returning null.");
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
        }
        return null;
    } catch (error) {
        if (error instanceof Error && (error.message.includes('Could not load the default credentials') || error.message.includes('Could not refresh access token') || error.message.includes('permission-denied') || error.message.includes('UNAUTHENTICATED'))) {
            console.warn(`Firestore permission error in getCurrentOrganization. This may be an expected error if the database has not been seeded yet. Please check IAM roles. Returning null.`);
            return null; 
        }
        console.error('Error getting current organization: ' + (error instanceof Error ? error.message : 'Unknown error'));
        return null;
    }
}
