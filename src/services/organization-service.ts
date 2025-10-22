/**
 * @fileOverview Service for managing organization data in Firestore.
 * THIS IS A SERVER-ONLY FILE. It must not be imported into any client components.
 */
'use server';

import { getFirestore as getAdminFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { Organization, OrganizationFooter } from './types';
import { getAdminDb } from './firebase-admin';
import { unstable_noStore as noStore } from 'next/cache';
import { defaultOrganization } from './organization-service-client';

// Re-export types for backward compatibility
export type { Organization, OrganizationFooter };

const ORGANIZATIONS_COLLECTION = 'organizations';

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
    if (!orgDoc.exists) {
        console.warn(`No organization document found with ID: ${id}. This is normal on first startup.`);
        return null;
    }
    const data = orgDoc.data();
    return { 
        id: orgDoc.id, 
        ...data,
        createdAt: (data!.createdAt as Timestamp)?.toDate(),
        updatedAt: (data!.updatedAt as Timestamp)?.toDate(),
        } as Organization;
  } catch (error) {
    console.warn(`Warning: Could not get organization with ID ${id}. Reason:`, error instanceof Error ? error.message : "Unknown error");
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
 * Fetches the main organization profile from the database.
 * This is now the definitive server-side function for this action.
 * @returns {Promise<Organization | null>} The organization object or null if not found or on error.
 */
export const getCurrentOrganization = async (): Promise<Organization> => {
    noStore(); // Opt out of caching for this specific function.
    try {
        const org = await getOrganization('main_org');
        // If org doesn't exist, return the reliable default object.
        return org || defaultOrganization;
    } catch (error) {
         const err = error instanceof Error ? error : new Error('Unknown error in getCurrentOrganization');
         console.warn(`[Graceful Fallback] Could not get current organization.`, err.message);
         // Return default to prevent page crashes.
         return defaultOrganization;
    }
}
