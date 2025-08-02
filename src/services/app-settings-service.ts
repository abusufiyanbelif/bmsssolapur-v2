
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

const SETTINGS_COLLECTION = 'settings';
const MAIN_SETTINGS_DOC_ID = 'main'; // Use a singleton document for global settings

export interface AppSettings {
  id?: string;
  loginMethods: {
    password: { enabled: boolean };
    otp: { enabled: boolean };
    google: { enabled: boolean };
  };
  services: {
    twilio: { enabled: boolean };
    nodemailer: { enabled: boolean };
    whatsapp: { enabled: boolean };
  };
  features: {
    directPaymentToBeneficiary: { enabled: boolean };
  };
  updatedAt?: Timestamp;
}

const defaultSettings: Omit<AppSettings, 'id' | 'updatedAt'> = {
    loginMethods: {
        password: { enabled: true },
        otp: { enabled: true },
        google: { enabled: true },
    },
    services: {
        twilio: { enabled: true },
        nodemailer: { enabled: true },
        whatsapp: { enabled: false },
    },
    features: {
        directPaymentToBeneficiary: { enabled: false },
    },
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
      return { id: settingsDoc.id, ...settingsDoc.data() } as AppSettings;
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
