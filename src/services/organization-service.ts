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

const defaultFooter: OrganizationFooter = {
    organizationInfo: { titleLine1: 'Baitul Mal (System Default)', titleLine2: 'Samajik Sanstha (System Default)', titleLine3: '(Solapur) (System Default)', description: 'Default description text.', registrationInfo: 'Reg. No. (System Default)', taxInfo: 'PAN: (System Default)' },
    contactUs: { title: 'Contact Us (System Default)', address: 'Default Address, Solapur', email: 'contact@example.com' },
    keyContacts: { title: 'Key Contacts (System Default)', contacts: [{name: 'Default Contact', phone: '0000000000'}] },
    connectWithUs: { title: 'Connect With Us (System Default)', socialLinks: [] },
    ourCommitment: { title: 'Our Commitment (System Default)', text: 'Default commitment text.', linkText: 'Learn More', linkUrl: '#' },
    copyright: { text: `© ${new Date().getFullYear()} Organization Name. All Rights Reserved. (System Default)` }
};

const defaultOrganization: Organization = {
    id: "main_org",
    name: "Default Organization Name",
    address: "Default Address",
    city: "Solapur",
    registrationNumber: "Default Reg No",
    contactEmail: "contact@example.com",
    contactPhone: "0000000000",
    createdAt: new Date(),
    updatedAt: new Date(),
    footer: defaultFooter,
};


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
    const adminDb = await getAdminDb();
    
    try {
        const orgQuery = adminDb.collection(ORGANIZATIONS_COLLECTION).limit(1);
        const querySnapshot = await orgQuery.get();
        
        if (querySnapshot.empty || (querySnapshot.docs.length === 1 && querySnapshot.docs[0].id === '_init_')) {
            console.log("No organization document found, returning null.");
            return null;
        }

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
    } catch (error) {
        console.error('Error getting current organization: ' + (error instanceof Error ? error.message : 'Unknown error'));
        // In case of error (e.g., permissions), we should not return a default.
        // The caller must handle the null case.
        return null;
    }
}
