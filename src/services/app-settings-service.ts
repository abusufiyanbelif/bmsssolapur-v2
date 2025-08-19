
/**
 * @fileOverview Service for managing global application settings in Firestore.
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, isConfigValid } from './firebase';
import type { AppSettings, UserRole, LeadStatus } from './types';
import { set } from 'react-hook-form';

// Re-export type for backward compatibility
export type { AppSettings };

const SETTINGS_COLLECTION = 'settings';
const MAIN_SETTINGS_DOC_ID = 'main'; // Use a singleton document for global settings

const defaultAdminRoles: UserRole[] = ['Super Admin', 'Admin', 'Finance Admin'];
const allUserRoles: UserRole[] = ['Super Admin', 'Admin', 'Finance Admin', 'Donor', 'Beneficiary', 'Referral'];
const allLeadStatuses: LeadStatus[] = ["Pending", "Ready For Help", "Publish", "Partial", "Complete", "Closed", "On Hold", "Cancelled"];

const defaultSettings: Omit<AppSettings, 'id' | 'updatedAt'> = {
    loginMethods: {
        password: { enabled: true },
        otp: { enabled: false },
        google: { enabled: false },
    },
    services: {
        twilio: { enabled: true },
        nodemailer: { enabled: true },
        whatsapp: { enabled: false },
    },
    features: {
        directPaymentToBeneficiary: { enabled: false },
    },
    paymentMethods: {
        bankTransfer: { enabled: true },
        cash: { enabled: true },
        upi: { enabled: true },
        other: { enabled: true },
    },
    paymentGateway: {
        razorpay: {
            enabled: false,
            mode: 'test',
            test: { keyId: '', keySecret: '' },
            live: { keyId: '', keySecret: '' },
        },
        phonepe: {
            enabled: false,
            mode: 'test',
            test: { merchantId: '', saltKey: '', saltIndex: 1 },
            live: { merchantId: '', saltKey: '', saltIndex: 1 },
        }
    },
    leadConfiguration: {
        disabledPurposes: [],
        workflow: allLeadStatuses.reduce((acc, status) => {
            acc[status] = allLeadStatuses.filter(s => s !== status); // Default: allow transition to any other status
            return acc;
        }, {} as Record<LeadStatus, LeadStatus[]>),
    },
    dashboard: {
        mainMetrics: { visibleTo: allUserRoles },
        fundsInHand: { visibleTo: defaultAdminRoles },
        monthlyContributors: { visibleTo: defaultAdminRoles },
        monthlyPledge: { visibleTo: defaultAdminRoles },
        pendingLeads: { visibleTo: defaultAdminRoles },
        pendingDonations: { visibleTo: defaultAdminRoles },
        leadsReadyToPublish: { visibleTo: defaultAdminRoles },
        beneficiaryBreakdown: { visibleTo: allUserRoles },
        campaignBreakdown: { visibleTo: allUserRoles },
        donationsChart: { visibleTo: defaultAdminRoles },
        topDonors: { visibleTo: defaultAdminRoles },
        recentCampaigns: { visibleTo: defaultAdminRoles },
        donationTypeBreakdown: { visibleTo: defaultAdminRoles },
    }
};

const mergeDeep = (target: any, source: any) => {
    const isObject = (obj: any) => obj && typeof obj === 'object';

    if (!isObject(target) || !isObject(source)) {
        return source;
    }

    Object.keys(source).forEach(key => {
        const targetValue = target[key];
        const sourceValue = source[key];

        if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
            // This is a simple merge; more complex logic may be needed for arrays of objects
            target[key] = [...new Set([...targetValue, ...sourceValue])];
        } else if (isObject(targetValue) && isObject(sourceValue)) {
            target[key] = mergeDeep({ ...targetValue }, sourceValue);
        } else {
            target[key] = sourceValue;
        }
    });

    return target;
};


/**
 * Retrieves the global application settings.
 * If no settings document exists, it creates one with default values.
 * @returns The application settings object.
 */
export const getAppSettings = async (): Promise<AppSettings> => {
  if (!isConfigValid) {
    console.warn("Firebase not configured. Returning default app settings.");
    return { id: MAIN_SETTINGS_DOC_ID, ...defaultSettings };
  }
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC_ID);
    const settingsDoc = await getDoc(settingsDocRef);
    
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      // Deep merge with defaults to handle nested objects and new settings
      const mergedSettings = mergeDeep({ ...defaultSettings }, data);
      return { id: settingsDoc.id, ...mergedSettings } as AppSettings;
    } else {
      // Document doesn't exist, so create it with defaults
      console.log("No settings document found. Creating one with default values.");
      const newSettings = {
        ...defaultSettings,
        updatedAt: serverTimestamp(),
      };
      await setDoc(settingsDocRef, newSettings);
      return { id: MAIN_SETTINGS_DOC_ID, ...defaultSettings }; // Return without timestamp for immediate use
    }
  } catch (error) {
    console.error('Error getting app settings: ', error);
    throw new Error('Failed to retrieve app settings.');
  }
};

/**
 * Updates the global application settings.
 * @param updates A partial object of the settings to update.
 */
export const updateAppSettings = async (updates: Partial<Omit<AppSettings, 'id'| 'updatedAt'>>): Promise<void> => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC_ID);
    await updateDoc(settingsDocRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating app settings: ", error);
    throw new Error('Failed to update app settings.');
  }
};
