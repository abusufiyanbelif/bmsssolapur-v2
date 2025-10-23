
/**
 * @fileOverview A service to seed the database with initial data.
 */

import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { User, UserRole, Lead, Verifier, LeadDonationAllocation, Donation, Campaign, FundTransfer, LeadAction, AppSettings, OrganizationFooter, Organization } from './types';
import { seedInitialQuotes } from '@/services/quotes-service';
import { getAdminDb, getAdminAuth, ensureCollectionExists } from './firebase-admin';
import { updatePublicCampaign, enrichCampaignWithPublicStats } from './public-data-service';
import { format } from 'date-fns';
import { revalidatePath } from 'next/cache';
import * as admin from 'firebase-admin';
import { DEFAULT_LOGO } from '@/services/organization-service-client';

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
    errors?: string[];
};

export const seedUsers = async (users: Omit<User, 'id' | 'createdAt' | 'userKey'>[]): Promise<string[]> => {
    const db = await getAdminDb();
    const results: string[] = [];

    for (const userData of users) {
        const usersRef = db.collection('users');
        
        let existingUserSnapshot;
        if(userData.userId) { // Prioritize checking by userId if it exists
             existingUserSnapshot = await usersRef.where('userId', '==', userData.userId).limit(1).get();
        } else {
             existingUserSnapshot = await usersRef.where('phone', '==', userData.phone).limit(1).get();
        }

        if (!existingUserSnapshot.empty) {
            results.push(`User ${userData.name}: Skipped (already exists)`);
        } else {
            try {
                const userRef = db.collection('users').doc(); // Auto-generate document ID
                const userCountSnapshot = await usersRef.count().get();
                const userKey = `USR${(userCountSnapshot.data().count + 1).toString().padStart(2, '0')}`;
                
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
    const db = await getAdminDb();
    const orgDocRef = db.collection('organizations').doc('main_org');
    
    // Always overwrite with the seed data to ensure consistency.
    await orgDocRef.set({ ...organizationToSeed, updatedAt: FieldValue.serverTimestamp() }, { merge: false });
    
    // Revalidate paths after seeding
    revalidatePath("/", "layout");
    revalidatePath("/organization");
    revalidatePath("/admin/organization-profile");

    return "Organization profile seeded/updated successfully.";
};


/**
 * Deletes all documents in a collection in batches.
 * @param collectionPath The path of the collection to delete.
 * @returns A message indicating the result.
 */
const deleteCollection = async (collectionPath: string): Promise<string> => {
    const db = await getAdminDb();
    const collectionRef = db.collection(collectionPath);
    let totalDeleted = 0;
    
    // eslint-disable-next-line no-constant-expression
    while (true) {
        const snapshot = await collectionRef.limit(500).get();
        if (snapshot.empty) {
            break; 
        }
        
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            // CRITICAL FIX: Do NOT delete the _init_ document. If the collection is needed again, it should exist.
            if (doc.id !== '_init_') {
                 batch.delete(doc.ref);
            }
        });

        const deletedInBatch = snapshot.docs.filter(d => d.id !== '_init_').length;
        if(deletedInBatch > 0) {
          await batch.commit();
          totalDeleted += deletedInBatch;
        }
        
        // If the only doc left is _init_ or snapshot size is less than batch size, we are done
        if (snapshot.size < 500 || (snapshot.size === 1 && snapshot.docs[0].id === '_init_')) {
            break;
        }
    }

    if (totalDeleted === 0) {
        return `Collection '${collectionPath}' is already empty.`;
    }

    return `Successfully deleted ${totalDeleted} documents from '${collectionPath}'.`;
};



// --- EXPORTED SEEDING FUNCTIONS ---

export const seedInitialUsersAndQuotes = async (): Promise<SeedResult> => {
    const quotesStatus = await seedInitialQuotes();
    return {
        message: 'Quotes Seeding Complete',
        details: [quotesStatus, "The 'admin' and 'anonymous_donor' users are automatically created on startup and were not affected."]
    };
};

export const seedCoreTeam = async (): Promise<SeedResult> => {
    const userResults = await seedUsers(coreTeamUsersToSeed);
    return {
        message: 'Core Team Seeding Complete',
        details: userResults
    };
};

export const seedOrganizationProfile = async (): Promise<SeedResult> => {
    const orgStatus = await seedOrganization();
    return { 
        message: 'Organization Profile Seeding Complete', 
        details: [orgStatus] 
    };
};

export const seedAppSettings = async (): Promise<SeedResult> => {
    const { updateAppSettings, getAppSettings } = await import('./app-settings-service');
    const defaultSettings = (await getAppSettings());
    await updateAppSettings(defaultSettings);
    return { message: "Application settings have been reset to their default values." };
};

export const seedPaymentGateways = async (): Promise<SeedResult> => {
    return { message: "Payment Gateway seeding is not fully implemented yet." };
};

export const seedCampaigns = async (campaigns: Omit<Campaign, 'createdAt' | 'updatedAt'>[]): Promise<string> => {
    const db = await getAdminDb();
    const batch = db.batch();
    let count = 0;
    
    for (const campaignData of campaigns) {
        const docRef = db.collection('campaigns').doc(campaignData.id);
        const dataToWrite = { ...campaignData, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
        batch.set(docRef, dataToWrite, { merge: true });
        
        const enriched = await enrichCampaignWithPublicStats(dataToWrite as Campaign);
        await updatePublicCampaign(enriched, enriched.status === 'Cancelled');
        
        count++;
    }

    await batch.commit();
    return `Seeded ${count} campaigns.`;
}

export const seedLeads = async (leads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string> => {
    const db = await getAdminDb();
    const batch = db.batch();
    let count = 0;

    for (const leadData of leads) {
        const userKey = (await db.collection('users').doc(leadData.beneficiaryId!).get()).data()?.userKey || `U${count}`;
        const leadCount = (await db.collection('leads').where('beneficiaryId', '==', leadData.beneficiaryId!).count().get()).data().count;
        const leadId = `${userKey}_${leadCount + 1}_${format(new Date(), 'ddMMyyyy')}`;

        const docRef = db.collection('leads').doc(leadId);
        // FIX: Ensure caseReportedDate is included
        batch.set(docRef, { ...leadData, dateCreated: Timestamp.now(), caseReportedDate: Timestamp.now(), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        count++;
    }

    await batch.commit();
    return `Seeded ${count} leads.`;
}

export const seedDonations = async (donations: Omit<Donation, 'id'>[]): Promise<string> => {
    const db = await getAdminDb();
    const batch = db.batch();
    let count = 0;

    for (const donationData of donations) {
        const docRef = db.collection('donations').doc(); // Auto-generate ID for donations
        batch.set(docRef, { ...donationData, createdAt: FieldValue.serverTimestamp() }, { merge: true });
        count++;
    }

    await batch.commit();
    return `Seeded ${count} donations.`;
}


export const seedSampleData = async (): Promise<SeedResult> => {
    const { seedSampleData: doSeed } = await import('../scripts/seed/seed-sample-data');
    return doSeed();
};

export const eraseInitialUsersAndQuotes = async (): Promise<SeedResult> => {
     const quotesResult = await deleteCollection('inspirationalQuotes');
     const orgResult = await deleteCollection('organizations');
     return { message: 'Initial Data Erased', details: [quotesResult, orgResult] };
};

export const eraseCoreTeam = async (): Promise<SeedResult> => {
    const db = await getAdminDb();
    const auth = await getAdminAuth();
    const coreTeamPhones = coreTeamUsersToSeed.map(u => u.phone);
    let deletedCount = 0;
    
    if (coreTeamPhones.length === 0) {
        return { message: "No core team members defined in the seed file." };
    }

    // Firestore has a limit of 10 items for 'in' queries. Process in chunks.
    const chunks = [];
    for (let i = 0; i < coreTeamPhones.length; i += 10) {
        chunks.push(coreTeamPhones.slice(i, i + 10));
    }
    
    for (const chunk of chunks) {
        const q = db.collection(USERS_COLLECTION).where('phone', 'in', chunk);
        const snapshot = await q.get();

        if (!snapshot.empty) {
            for (const userDoc of snapshot.docs) {
                try {
                    await auth.deleteUser(userDoc.id);
                } catch (e: any) {
                    if (e.code !== 'auth/user-not-found') throw e; // Re-throw if it's not a "not found" error
                }
                await userDoc.ref.delete();
                deletedCount++;
            }
        }
    }

    return { message: `Erased ${deletedCount} core team member(s) from Firestore and Firebase Auth.` };
};

export const eraseOrganizationProfile = async (): Promise<SeedResult> => {
    const result = await deleteCollection('organizations');
    return { message: 'Organization Profile Erased', details: [result] };
};

export const erasePaymentGateways = async (): Promise<SeedResult> => {
    const { updateAppSettings } = await import('./app-settings-service');
    await updateAppSettings({ paymentGateway: {} });
    return { message: 'Payment gateway settings have been cleared.' };
};

export const eraseSampleData = async (): Promise<SeedResult> => {
    const collectionsToDelete = ['leads', 'donations', 'campaigns', 'publicLeads', 'publicCampaigns'];
    const results = [];
    for (const collection of collectionsToDelete) {
        results.push(await deleteCollection(collection));
    }
    // Also remove sample users
    const db = await getAdminDb();
    const sampleUsersQuery = db.collection(USERS_COLLECTION).where('source', '==', 'Seeded');
    const sampleUsersSnapshot = await sampleUsersQuery.get();
    if (!sampleUsersSnapshot.empty) {
      const batch = db.batch();
      sampleUsersSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      results.push(`Deleted ${sampleUsersSnapshot.size} sample user documents.`);
    }

    return { message: "Sample data erased.", details: results };
};

export const eraseAppSettings = async (): Promise<SeedResult> => {
    const result = await deleteCollection('settings');
    return { message: 'Application settings erased.', details: [result, "Settings will be recreated with defaults on next app start."] };
};

export const eraseFirebaseAuthUsers = async (): Promise<SeedResult> => {
    const auth = await getAdminAuth();
    const users = await auth.listUsers(1000);
    let deletedCount = 0;
    for (const user of users.users) {
        if(user.email !== 'admin@example.com' && user.email !== 'anonymous@system.local') {
            await auth.deleteUser(user.uid);
            deletedCount++;
        }
    }
    return { message: `Erased ${deletedCount} user(s) from Firebase Authentication. System users were preserved.` };
};

export const syncUsersToFirebaseAuth = async (): Promise<SeedResult> => {
    const adminDb = await getAdminDb();
    const adminAuth = await getAdminAuth();
    
    const usersSnapshot = await adminDb.collection(USERS_COLLECTION).get();
    
    let createdCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const details: string[] = [];

    for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data() as User;
        const userId = userDoc.id;

        try {
            // Check if user already exists in Auth
            await adminAuth.getUser(userId);
            skippedCount++;
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                // User does not exist, so create them
                try {
                    const authUserPayload: admin.auth.CreateRequest = {
                        uid: userId,
                        email: user.email,
                        phoneNumber: user.phone ? `+91${user.phone}` : undefined,
                        displayName: user.name,
                        password: user.password,
                        disabled: !user.isActive,
                    };

                    await adminAuth.createUser(authUserPayload);
                    createdCount++;
                    details.push(`Created Auth record for ${user.name} (${user.email || user.phone}).`);
                } catch (creationError: any) {
                    failedCount++;
                    const errorMessage = `Failed to create Auth record for ${user.name}: ${creationError.message}`;
                    console.error(errorMessage);
                    details.push(errorMessage);
                }
            } else {
                // Some other error occurred when checking for the user
                failedCount++;
                const errorMessage = `Error checking Auth status for ${user.name}: ${error.message}`;
                console.error(errorMessage);
                details.push(errorMessage);
            }
        }
    }

    const message = `Sync complete. Created: ${createdCount}, Skipped: ${skippedCount}, Failed: ${failedCount}.`;
    return { message, details };
};

// --- DATA TO BE SEEDED ---

const organizationToSeed: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> = {
    name: "Baitul Mal Samajik Sanstha (Solapur)",
    logoUrl: DEFAULT_LOGO,
    address: "123 Muslim Peth",
    city: "Solapur",
    registrationNumber: "MAHA/123/2024/SOLAPUR",
    panNumber: "ABCDE1234F",
    contactEmail: "contact@baitulmalsolapur.org",
    contactPhone: "7887646583",
    website: "https://www.baitulmalsolapur.org",
    bankAccountName: "BAITULMAL SAMAJIK SANSTHA",
    bankAccountNumber: "012345678901",
    bankIfscCode: "ICIC0001234",
    upiId: "baitulmal.solapur@okaxis",
    qrCodeUrl: "https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect.appspot.com/o/app-assets%2Fupi-qr-code.png?alt=media&token=c1374b76-b568-450f-90de-3f191195a63c",
    hero: {
        title: "Empowering Our Community, One Act of Kindness at a Time.",
        description: "Join BaitulMal Samajik Sanstha (Solapur) to make a lasting impact. Your contribution brings hope, changes lives, and empowers our community."
    },
    guidingPrinciples: [
        "Trust is focused on assisting educational and health beneficiaries.",
        "Priority will be given to males studying in their final year of a course.",
        "Assisting orphan girls in all forms except marriage.",
        "Providing ration to the most deserving (mustahik) in the last week of each month, depending on available funds.",
        "A return agreement will be secured from educational beneficiaries if the amount exceeds ₹25,000.",
        "The maximum capital credited will be ₹40,000, but this can be raised in exceptional cases."
    ],
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
        address: "123 Muslim Peth, Solapur, Maharashtra, India",
        email: "contact@baitulmalsolapur.org"
      },
      keyContacts: {
        title: "Key Contacts",
        contacts: [
          { name: "Maaz Shaikh", phone: "9372145889" },
          { name: "AbuRehan Bedrekar", phone: "7276224160" },
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


    
