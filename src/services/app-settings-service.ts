

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
            keyId: '',
            keySecret: '',
        },
        phonepe: {
            enabled: true,
            merchantId: '',
            saltKey: '',
            saltIndex: 1,
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
      // Merge with defaults to handle cases where new settings are added
      // to the code but don't exist in the Firestore document yet.
      const mergedSettings = {
        ...defaultSettings,
        ...data,
        loginMethods: { ...defaultSettings.loginMethods, ...data.loginMethods },
        services: { ...defaultSettings.services, ...data.services },
        features: { ...defaultSettings.features, ...data.features },
        paymentMethods: { ...defaultSettings.paymentMethods, ...data.paymentMethods },
        paymentGateway: { 
            ...defaultSettings.paymentGateway, 
            ...data.paymentGateway,
            razorpay: { ...defaultSettings.paymentGateway.razorpay, ...data.paymentGateway?.razorpay },
            phonepe: { ...defaultSettings.paymentGateway.phonepe, ...data.paymentGateway?.phonepe },
        },
        leadConfiguration: { 
            ...defaultSettings.leadConfiguration, 
            ...data.leadConfiguration,
            // Ensure workflow is populated if it's missing from DB
            workflow: data.leadConfiguration?.workflow || defaultSettings.leadConfiguration.workflow,
        },
        dashboard: { ...defaultSettings.dashboard, ...data.dashboard },
      };
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
export const updateAppSettings = async (updates: Partial<AppSettings>): Promise<void> => {
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
