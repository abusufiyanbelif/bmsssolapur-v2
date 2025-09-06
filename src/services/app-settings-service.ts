

/**
 * @fileOverview Service for managing global application settings in Firestore.
 * This service should only be called from server-side components or server actions.
 */

import { getAdminDb } from './firebase-admin';
import type { AppSettings, UserRole, LeadStatus, DashboardSettings, LeadPurpose, PurposeCategory } from './types';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

// Re-export type for backward compatibility
export type { AppSettings };

const SETTINGS_COLLECTION = 'settings';
const MAIN_SETTINGS_DOC_ID = 'main'; // Use a singleton document for global settings

const defaultAdminRoles: UserRole[] = ['Super Admin', 'Admin', 'Finance Admin'];
const allUserRoles: UserRole[] = ['Super Admin', 'Admin', 'Finance Admin', 'Donor', 'Beneficiary', 'Referral'];
const allLeadStatuses: LeadStatus[] = ["Pending", "Open", "Complete", "On Hold", "Cancelled", "Closed", "Partial"];

const defaultGatewayConfig = {
    enabled: false,
    mode: 'test' as 'test' | 'live',
    test: {},
    live: {},
};

const defaultLeadPurposes: LeadPurpose[] = [
    { 
        id: 'education', 
        name: 'Education', 
        enabled: true, 
        categories: [
            { id: 'school-fees', name: 'School Fees', enabled: true },
            { id: 'college-fees', name: 'College Fees', enabled: true },
            { id: 'tuition-fees', name: 'Tuition Fees', enabled: true },
            { id: 'exam-fees', name: 'Exam Fees', enabled: true },
            { id: 'hostel-fees', name: 'Hostel Fees', enabled: true },
            { id: 'books-uniforms', name: 'Books & Uniforms', enabled: true },
            { id: 'educational-materials', name: 'Educational Materials', enabled: true },
            { id: 'other', name: 'Other', enabled: true },
        ]
    },
    { 
        id: 'medical', 
        name: 'Medical', 
        enabled: true,
        categories: [
            { id: 'hospital-bill', name: 'Hospital Bill', enabled: true },
            { id: 'medication', name: 'Medication', enabled: true },
            { id: 'doctor-consultation', name: 'Doctor Consultation', enabled: true },
            { id: 'surgical-procedure', name: 'Surgical Procedure', enabled: true },
            { id: 'medical-tests', name: 'Medical Tests', enabled: true },
            { id: 'medical-equipment', name: 'Medical Equipment', enabled: true },
            { id: 'other', name: 'Other', enabled: true },
        ]
    },
    { 
        id: 'relief-fund', 
        name: 'Relief Fund', 
        enabled: true,
        categories: [
            { id: 'ration-kit', name: 'Ration Kit', enabled: true },
            { id: 'financial-aid', name: 'Financial Aid', enabled: true },
            { id: 'disaster-relief', name: 'Disaster Relief', enabled: true },
            { id: 'shelter-assistance', name: 'Shelter Assistance', enabled: true },
            { id: 'utility-bill-payment', name: 'Utility Bill Payment', enabled: true },
            { id: 'other', name: 'Other', enabled: true },
        ]
    },
    { 
        id: 'deen', 
        name: 'Deen', 
        enabled: true,
        categories: [
            { id: 'masjid-maintenance', name: 'Masjid Maintenance', enabled: true },
            { id: 'madrasa-support', name: 'Madrasa Support', enabled: true },
            { id: 'dawah-activities', name: 'Da\'wah Activities', enabled: true },
            { id: 'other', name: 'Other', enabled: true },
        ]
    },
    { 
        id: 'loan', 
        name: 'Loan', 
        enabled: true,
        categories: [
             { id: 'business-loan', name: 'Business Loan', enabled: true },
             { id: 'emergency-loan', name: 'Emergency Loan', enabled: true },
             { id: 'education-loan', name: 'Education Loan', enabled: true },
             { id: 'personal-loan', name: 'Personal Loan', enabled: true },
             { id: 'other', name: 'Other', enabled: true },
        ]
    },
    { 
        id: 'other', 
        name: 'Other', 
        enabled: true,
        categories: []
    },
];

const defaultSettings: Omit<AppSettings, 'id' | 'updatedAt'> = {
    loginMethods: {
        password: { enabled: true },
        otp: { enabled: false },
        google: { enabled: false },
    },
    notificationSettings: {
        sms: {
            provider: 'twilio',
            twilio: { accountSid: '', authToken: '', verifySid: '', fromNumber: '' }
        },
        whatsapp: {
            provider: 'twilio',
            twilio: { accountSid: '', authToken: '', fromNumber: '' }
        },
        email: {
            provider: 'nodemailer',
            nodemailer: { host: '', port: 587, secure: true, user: '', pass: '', from: '' }
        }
    },
    features: {
        directPaymentToBeneficiary: { enabled: false },
        onlinePaymentsEnabled: true,
    },
    paymentMethods: {
        bankTransfer: { enabled: true },
        cash: { enabled: true },
        upi: { enabled: true },
        other: { enabled: true },
    },
    paymentGateway: {
        razorpay: defaultGatewayConfig,
        phonepe: defaultGatewayConfig,
        paytm: defaultGatewayConfig,
        cashfree: defaultGatewayConfig,
        instamojo: defaultGatewayConfig,
        stripe: defaultGatewayConfig,
    },
    donationConfiguration: {
        allowDonorSelfServiceDonations: true,
    },
    leadConfiguration: {
        purposes: defaultLeadPurposes,
        approvalProcessDisabled: true,
        roleBasedCreationEnabled: false,
        leadCreatorRoles: ['Admin', 'Super Admin'],
        allowBeneficiaryRequests: true, // New default setting
        workflow: allLeadStatuses.reduce((acc, status) => {
            acc[status] = allLeadStatuses.filter(s => s !== status); // Default: allow transition to any other status
            return acc;
        }, {} as Record<LeadStatus, LeadStatus[]>),
    },
    dashboard: {
        mainMetrics: { visibleTo: defaultAdminRoles },
        fundsInHand: { visibleTo: ['Super Admin', 'Finance Admin'] },
        monthlyContributors: { visibleTo: ['Super Admin', 'Finance Admin'] },
        monthlyPledge: { visibleTo: ['Super Admin', 'Finance Admin'] },
        pendingLeads: { visibleTo: defaultAdminRoles },
        pendingDonations: { visibleTo: defaultAdminRoles },
        leadsReadyToPublish: { visibleTo: defaultAdminRoles },
        beneficiaryBreakdown: { visibleTo: defaultAdminRoles },
        campaignBreakdown: { visibleTo: defaultAdminRoles },
        leadBreakdown: { visibleTo: defaultAdminRoles },
        donationsChart: { visibleTo: defaultAdminRoles },
        topDonors: { visibleTo: defaultAdminRoles },
        recentCampaigns: { visibleTo: defaultAdminRoles },
        donationTypeBreakdown: { visibleTo: defaultAdminRoles },
        // Role-specific dashboards
        donorContributionSummary: { visibleTo: ['Donor'] },
        donorImpactSummary: { visibleTo: ['Donor'] },
        beneficiarySummary: { visibleTo: ['Beneficiary'] },
        referralSummary: { visibleTo: ['Referral', 'Admin', 'Super Admin'] },
    },
    analyticsDashboard: {
        financialPerformance: { visibleTo: ['Super Admin'] },
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
            target[key] = [...new Set([...sourceValue])];
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
  const adminDb = getAdminDb();
  try {
    const settingsDocRef = adminDb.collection(SETTINGS_COLLECTION).doc(MAIN_SETTINGS_DOC_ID);
    const settingsDoc = await settingsDocRef.get();
    
    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      // Deep merge with defaults to handle nested objects and new settings
      const mergedSettings = mergeDeep({ ...defaultSettings }, data);
       if (mergedSettings.updatedAt instanceof Timestamp) {
        mergedSettings.updatedAt = mergedSettings.updatedAt.toDate();
      }
      return { id: settingsDoc.id, ...mergedSettings } as AppSettings;
    } else {
      // Document doesn't exist, so create it with defaults
      console.log("No settings document found. Creating one with default values.");
      const newSettings = {
        ...defaultSettings,
        updatedAt: Timestamp.now(),
      };
      await settingsDocRef.set(newSettings);
      return { id: MAIN_SETTINGS_DOC_ID, ...defaultSettings, updatedAt: new Date() } as AppSettings;
    }
  } catch (error) {
    console.error('Error getting app settings: ', error);
    throw new Error('Failed to retrieve app settings.');
  }
};

/**
 * Updates the global application settings.
 * This is a server-only function.
 * @param updates A partial object of the settings to update.
 */
export const updateAppSettings = async (updates: Partial<Omit<AppSettings, 'id'| 'updatedAt'>>) => {
  const adminDb = getAdminDb();
  try {
    const settingsDocRef = adminDb.collection(SETTINGS_COLLECTION).doc(MAIN_SETTINGS_DOC_ID);
    const updateWithTimestamp: Partial<AppSettings> & { updatedAt: FieldValue } = {
        ...updates,
        updatedAt: Timestamp.now(),
    };
    await settingsDocRef.update(updateWithTimestamp);
  } catch (error) {
    console.error("Error updating app settings: ", error);
    if (error instanceof Error) {
        // Pass the specific Firestore error message up the chain
        throw new Error(error.message);
    }
    throw new Error('An unknown error occurred while updating app settings.');
  }
};
