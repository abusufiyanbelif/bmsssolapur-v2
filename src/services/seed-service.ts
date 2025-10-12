
/**
 * @fileOverview A service to seed the database with initial data.
 */

import admin from "firebase-admin";
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { User, UserRole, Lead, Verifier, LeadDonationAllocation, Donation, Campaign, FundTransfer, LeadAction, AppSettings, OrganizationFooter } from './types';
import { quranQuotes } from './quotes/quran';
import { hadithQuotes } from './quotes/hadith';
import { scholarQuotes } from './quotes/scholars';

// Initialize the Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // Use application default credentials, which works for both local development
      // (gcloud auth application-default login) and deployed Google Cloud environments.
      credential: admin.credential.applicationDefault(),
    });
     console.log('Firebase Admin SDK initialized successfully for seeding.');
  } catch (e: any) {
     console.error('Firebase Admin SDK initialization error', e);
     // Exit gracefully if we can't connect, as no seed scripts can run.
     process.exit(1);
  }
}

const db = getFirestore();

// Re-export type for backward compatibility
export type { User, UserRole };

const USERS_COLLECTION = 'users';

const coreTeamUsersToSeed: Omit<User, 'id' | 'createdAt' | 'userKey'>[] = [
     { 
        name: "Abusufiyan Belif", 
        userId: "abusufiyan.belif", 
        firstName: "Abusufiyan", 
        middleName: "", 
        lastName: "Belif",
        fatherName: "Abdur Rauf", 
        email: "abusufiyan.belif@gmail.com", 
        phone: "7887646583", 
        password: "admin", 
        roles: ["Super Admin", "Donor", "Beneficiary"], 
        privileges: ["all"], 
        groups: ["Member of Organization", "Mandatory Lead Approver"], 
        isActive: true, 
        gender: 'Male', 
        address: { addressLine1: '123 Admin Lane', city: 'Solapur', state: 'Maharashtra', country: 'India', pincode: '413001' }, 
        panNumber: 'ABCDE1234F', 
        aadhaarNumber: '123456789012',
        bankAccountName: 'Abusufiyan Belif',
        bankAccountNumber: '1234567890123456',
        bankIfscCode: 'ICIC0001234',
        upiIds: ['abusufiyan.belief5@okicici'],
        source: 'Seeded' 
    },
    
    // Admins (Founders and Members)
    { 
        name: "Moosa Shaikh", 
        userId: "moosa.shaikh", 
        firstName: "Moosa", 
        middleName: "", 
        lastName: "Shaikh", 
        fatherName: "", 
        email: "moosa.shaikh@example.com", 
        phone: "8421708907", 
        password: "8421708907", 
        roles: ["Super Admin", "Admin", "Donor"], 
        privileges: ["all"], 
        groups: ["Founder", "Lead Approver"], 
        isActive: true, 
        gender: 'Male', 
        address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, 
        upiIds: ['8421708907@ybl'], 
        source: 'Seeded' 
    },
    { name: "Maaz Shaikh", userId: "maaz.shaikh", firstName: "Maaz", middleName: "", lastName: "Shaikh", fatherName: "", email: "maaz.shaikh@example.com", phone: "9372145889", password: "9372145889", roles: ["Admin", "Finance Admin", "Donor"], privileges: ["canManageDonations", "canViewFinancials"], groups: ["Finance", "Lead Approver"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { name: "AbuRehan Bedrekar", userId: "aburehan.bedrekar", firstName: "AbuRehan", middleName: "", lastName: "Bedrekar", fatherName: "", email: "aburehan.bedrekar@example.com", phone: "7276224160", password: "7276224160", roles: ["Admin", "Donor"], privileges: ["canManageLeads"], groups: ["Co-Founder", "Lead Approver"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { name: "NayyarAhmed Karajgi", userId: "nayyarahmed.karajgi", firstName: "NayyarAhmed", middleName: "", lastName: "Karajgi", fatherName: "", email: "nayyar.karajgi@example.com", phone: "9028976036", password: "9028976036", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { name: "Arif Baig", userId: "arif.baig", firstName: "Arif", middleName: "", lastName: "Baig", fatherName: "", email: "arif.baig@example.com", phone: "9225747045", password: "9225747045", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { name: "Mazhar Shaikh", userId: "mazhar.shaikh", firstName: "Mazhar", middleName: "", lastName: "Shaikh", fatherName: "", email: "mazhar.shaikh@example.com", phone: "8087669914", password: "8087669914", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { name: "Mujahid Chabukswar", userId: "mujahid.chabukswar", firstName: "Mujahid", middleName: "", lastName: "Chabukswar", fatherName: "", email: "mujahid.chabukswar@example.com", phone: "8087420544", password: "8087420544", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { name: "Muddasir Shaikh", userId: "muddasir.shaikh", firstName: "Muddasir", middleName: "", lastName: "Shaikh", fatherName: "", email: "muddasir@example.com", phone: "7385557820", password: "7385557820", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
];

export type SeedItemResult = { name: string; status: 'Created' | 'Updated' | 'Skipped (already exists)' | 'Failed' };
export type SeedResult = {
    message: string;
    details?: string[];
};

const seedUsers = async (users: Omit<User, 'id' | 'createdAt' | 'userKey'>[]): Promise<string[]> => {
    const results: string[] = [];

    for (const userData of users) {
        const usersRef = db.collection('users');
        const q = usersRef.where('phone', '==', userData.phone).limit(1);
        const existingUserSnapshot = await q.get();

        if (!existingUserSnapshot.empty) {
            results.push(`User ${userData.name}: Skipped (already exists)`);
        } else {
            try {
                const userRef = db.collection('users').doc();
                const userKeySnapshot = await usersRef.count().get();
                const userKey = `USR${(userKeySnapshot.data().count + 1).toString().padStart(2, '0')}`;
                
                await userRef.set({
                    ...userData,
                    userKey,
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });
                results.push(`User ${userData.name}: Created`);
            } catch (e) {
                 results.push(`User ${userData.name}: Failed to create.`);
                 console.error(`Failed to create user ${userData.name}:`, e);
            }
        }
    }
    return results;
};

const seedOrganization = async (): Promise<string> => {
    const orgCollectionRef = db.collection('organizations');
    const existingOrgSnapshot = await orgCollectionRef.limit(1).get();

    if (!existingOrgSnapshot.empty) {
        const orgDocRef = existingOrgSnapshot.docs[0].ref;
        await orgDocRef.set({ ...organizationToSeed, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        return "Organization profile updated with seed data.";
    }
    
    await orgCollectionRef.doc('main_org').set({ ...organizationToSeed, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return "Organization profile created successfully.";
}

// --- EXPORTED SEEDING FUNCTIONS ---

export const seedInitialUsersAndQuotes = async (): Promise<SeedResult> => {
    const orgStatus = await seedOrganization();
    // seedQuotesService is now handled inside ensureCollectionsExist on startup
    return {
        message: 'Initial Seeding Complete',
        details: [orgStatus, "The 'admin' and 'anonymous_donor' users are automatically created on startup."]
    };
};

export const seedCoreTeam = async (): Promise<SeedResult> => {
    const userResults = await seedUsers(coreTeamUsersToSeed);
    return {
        message: 'Core Team Seeding Complete',
        details: userResults
    };
};

// Functions below are placeholders as they require more complex logic and services that might not be available yet.

export const seedOrganizationProfile = async (): Promise<SeedResult> => {
    const orgStatus = await seedOrganization();
    return { message: 'Organization Profile Seeding Complete', details: [orgStatus] };
};

export const seedAppSettings = async (): Promise<SeedResult> => {
    // This functionality depends on updateAppSettings which might be in another service.
    // For now, we return a placeholder message.
    return { message: "App Settings seeding is not fully implemented yet." };
};

export const seedPaymentGateways = async (): Promise<SeedResult> => {
    return { message: "Payment Gateway seeding is not fully implemented yet." };
};

export const seedSampleData = async (): Promise<SeedResult> => {
    return { message: "Sample Data seeding is not fully implemented yet." };
};

export const eraseInitialUsersAndQuotes = async (): Promise<SeedResult> => {
     return { message: "Erase initial data is not fully implemented yet." };
};

export const eraseCoreTeam = async (): Promise<SeedResult> => {
    return { message: "Erase core team is not fully implemented yet." };
};

export const eraseOrganizationProfile = async (): Promise<SeedResult> => {
    return { message: "Erase organization profile is not fully implemented yet." };
};

export const erasePaymentGateways = async (): Promise<SeedResult> => {
    return { message: "Erase payment gateways is not fully implemented yet." };
};

export const eraseSampleData = async (): Promise<SeedResult> => {
    return { message: "Erase sample data is not fully implemented yet." };
};

export const eraseAppSettings = async (): Promise<SeedResult> => {
    return { message: "Erase app settings is not fully implemented yet." };
};

export const eraseFirebaseAuthUsers = async (): Promise<SeedResult> => {
    return { message: "Erase Firebase Auth users is not fully implemented yet." };
};

export const syncUsersToFirebaseAuth = async (): Promise<SeedResult> => {
    return { message: "Sync to Firebase Auth is not fully implemented yet." };
};

// --- DATA TO BE SEEDED ---

const organizationToSeed = {
    id: "main_org",
    name: "Baitul Mal Samajik Sanstha (Solapur)",
    address: "123 Muslim Peth",
    city: "Solapur",
    registrationNumber: "MAHA/123/2024/SOLAPUR",
    panNumber: "ABCDE1234F",
    contactEmail: "contact@baitulmalsolapur.org",
    contactPhone: "+91 9372145889",
    website: "https://www.baitulmalsolapur.org",
    bankAccountName: "BAITULMAL SAMAJIK SANSTHA",
    bankAccountNumber: "012345678901",
    bankIfscCode: "ICIC0001234",
    upiId: "baitulmal.solapur@okaxis",
    footer: {
      organizationInfo: {
        titleLine1: "BAITUL MAL",
        titleLine2: "SAMAJIK SANSTHA",
        titleLine3: "(SOLAPUR)",
        description: "A registered charitable organization dedicated to providing financial assistance for education, healthcare, and relief to the underprivileged, adhering to Islamic principles of charity.",
        registrationInfo: "Reg. No. MAHA/123/2024/SOLAPUR",
        taxInfo: "PAN: ABCDE1234F"
      },
      contactUs: {
        title: "Contact Us",
        address: "123 Muslim Peth, Solapur, Maharashtra 413001, India",
        email: "contact@baitulmalsolapur.org"
      },
      keyContacts: {
        title: "Key Contacts",
        contacts: [
          { name: "Abusufiyan Belif", phone: "7887646583" },
          { name: "Moosa Shaikh", phone: "8421708907" }
        ]
      },
      connectWithUs: {
        title: "Connect With Us",
        socialLinks: [
          { platform: 'Facebook', url: 'https://facebook.com' },
          { platform: 'Instagram', url: 'https://instagram.com' }
        ]
      },
      ourCommitment: {
        title: "Our Commitment",
        text: "We are committed to transparency and accountability in all our operations, ensuring that your contributions make a real impact.",
        linkText: "Learn More",
        linkUrl: "/organization"
      },
      copyright: {
        text: `© ${new Date().getFullYear()} Baitul Mal Samajik Sanstha (Solapur). All Rights Reserved.`
      }
    }
};
