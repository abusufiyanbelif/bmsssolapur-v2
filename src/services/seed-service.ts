/**
 * @fileOverview A service to seed the database with initial data.
 */

import { createUser, User, UserRole } from './user-service';
import { createOrganization, Organization } from './organization-service';
import { seedInitialQuotes } from './quotes-service';
import { db, isConfigValid } from './firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

const usersToSeed: Omit<User, 'id' | 'createdAt'>[] = [
    // Super Admin
    { name: "Abusufiyan Belif", email: "abusufiyan.belif@gmail.com", phone: "7887646583", roles: ["Super Admin", "Admin", "Donor", "Beneficiary"], privileges: ["all"], groups: ["Founder", "Co-Founder", "Finance", "Lead Approver"], isActive: true, gender: 'Male', address: '123 Admin Lane, Solapur', panNumber: 'ABCDE1234F', aadhaarNumber: '123456789012' },
    
    // Default Admin User
    { name: "admin", email: "admin@internal.app", phone: "9999999999", roles: ["Super Admin", "Admin", "Donor", "Beneficiary"], privileges: ["all"], groups: ["Founder", "Co-Founder", "Finance", "Lead Approver"], isActive: true, gender: 'Male', address: '1 Admin Way, Solapur', panNumber: 'ADMINPAN123', aadhaarNumber: '999999999999' },

    // Admins (Founders and Members)
    { name: "Moosa Shaikh", email: "moosa.shaikh@example.com", phone: "8421708907", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Founder", "Lead Approver"], isActive: true, gender: 'Male', address: 'Solapur', panNumber: '', aadhaarNumber: '' },
    { name: "Maaz Shaikh", email: "maaz.shaikh@example.com", phone: "9372145889", roles: ["Admin", "Finance Admin"], privileges: ["canManageDonations", "canViewFinancials"], groups: ["Finance"], isActive: true, gender: 'Male', address: 'Solapur', panNumber: '', aadhaarNumber: '' },
    { name: "Abu Rehan Bedrekar", email: "aburehan.bedrekar@example.com", phone: "7276224160", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Co-Founder", "Lead Approver"], isActive: true, gender: 'Male', address: 'Solapur', panNumber: '', aadhaarNumber: '' },
    { name: "Nayyar Ahmed Karajgi", email: "nayyar.karajgi@example.com", phone: "9028976036", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: 'Solapur', panNumber: '', aadhaarNumber: '' },
    { name: "Arif Baig", email: "arif.baig@example.com", phone: "9225747045", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: 'Solapur', panNumber: '', aadhaarNumber: '' },
    { name: "Mazhar Shaikh", email: "mazhar.shaikh@example.com", phone: "8087669914", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: 'Solapur', panNumber: '', aadhaarNumber: '' },
    { name: "Mujahid Chabukswar", email: "mujahid.chabukswar@example.com", phone: "8087420544", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: 'Solapur', panNumber: '', aadhaarNumber: '' },
    { name: "Muddasir", email: "muddasir@example.com", phone: "7385557820", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: 'Solapur', panNumber: '', aadhaarNumber: '' },
    
    // Generic Donor for Anonymous Donations
    { name: "Anonymous Donor", email: "anonymous@example.com", phone: "0000000000", roles: ["Donor"], privileges: [], isActive: true, gender: 'Other', address: '', panNumber: '', aadhaarNumber: '' },

    // Generic users for testing roles
    { name: "Aisha Khan", email: "aisha.khan@example.com", phone: "1234567890", roles: ["Donor", "Beneficiary"], privileges: [], isActive: true, gender: 'Female', address: '456 Test Ave, Solapur', panNumber: '', aadhaarNumber: '' },
    { name: "Beneficiary User", email: "beneficiary@example.com", phone: "0987654321", roles: ["Beneficiary"], privileges: [], isActive: true, gender: 'Female', address: '789 Sample St, Solapur', panNumber: '', aadhaarNumber: '' },
];

const organizationToSeed: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> = {
    name: "BAITULMAL SAMAJIK SANSTHA SOLAPUR",
    city: "Solapur",
    address: "Solapur, Maharashtra, India",
    registrationNumber: "MAHA/123/2024",
    panNumber: "AAFTB9401P",
    contactEmail: "contact@baitulmalsolapur.org",
    contactPhone: "+91 12345 67890",
    website: "https://baitulmalsolapur.org",
    upiId: "maaz9145@okhdfcbank"
};

export type UserSeedResult = { name: string; phone: string; status: 'Created' | 'Skipped (already exists)' };
export type SeedResult = {
    userResults: UserSeedResult[];
    orgStatus: string;
    quotesStatus: string;
    error?: string;
};

const seedUsers = async (): Promise<UserSeedResult[]> => {
    if (!isConfigValid) {
        throw new Error("Firebase is not configured. Cannot seed users.");
    }
    console.log('Seeding users...');
    const results: UserSeedResult[] = [];

    for (const userData of usersToSeed) {
        // Find existing user by phone to avoid duplicates
        const q = query(collection(db, 'users'), where("phone", "==", userData.phone));
        const existingUsers = await getDocs(q);
        
        if (existingUsers.empty) {
            await createUser({
                ...userData,
                createdAt: Timestamp.now()
            });
            results.push({ name: userData.name, phone: userData.phone, status: 'Created' });
        } else {
            results.push({ name: userData.name, phone: userData.phone, status: 'Skipped (already exists)' });
        }
    }

    console.log('User seeding process finished.');
    return results;
};

const seedOrganization = async (): Promise<string> => {
    if (!isConfigValid) {
        throw new Error("Firebase is not configured. Cannot seed organization.");
    }
    const orgsCollection = collection(db, 'organizations');
    const snapshot = await getDocs(orgsCollection);
    if (!snapshot.empty) {
        const msg = 'Organization already exists. Skipped seeding.';
        console.log(msg);
        return msg;
    }
    
    console.log('Seeding organization...');
    await createOrganization(organizationToSeed);
    return 'Organization seeded successfully.';
};


export const seedDatabase = async (): Promise<SeedResult> => {
    console.log('Attempting to seed database...');
    if (!isConfigValid) {
        const errorMsg = "Firebase is not configured. Aborting seed.";
        console.error(errorMsg);
        return {
            userResults: [],
            orgStatus: 'Failed',
            quotesStatus: 'Failed',
            error: errorMsg,
        }
    }
    try {
        const userResults = await seedUsers();
        const orgStatus = await seedOrganization();
        const quotesStatus = await seedInitialQuotes();
        console.log('Database seeding process completed.');
        return { userResults, orgStatus, quotesStatus };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred during seeding.';
        console.error('Error seeding database:', errorMsg);
        return {
            userResults: [],
            orgStatus: 'Failed',
            quotesStatus: 'Failed',
            error: errorMsg,
        };
    }
};
