/**
 * @fileOverview A service to seed the database with initial data.
 */

import { createUser, User, UserRole } from './user-service';
import { createOrganization, Organization } from './organization-service';
import { db, isConfigValid } from './firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

const usersToSeed: Omit<User, 'id' | 'createdAt'>[] = [
    // Super Admin
    { name: "Abusufiyan Belif", email: "abusufiyan.belif@gmail.com", phone: "7887646583", roles: ["Super Admin", "Admin", "Donor", "Beneficiary"], privileges: ["all"], groups: ["Founder", "Co-Founder", "Finance", "Lead Approver"], isActive: true, gender: 'Male' },
    
    // Default Admin User
    { name: "admin", email: "admin@internal.app", phone: "9999999999", roles: ["Super Admin", "Admin", "Donor", "Beneficiary"], privileges: ["all"], groups: ["Founder", "Co-Founder", "Finance", "Lead Approver"], isActive: true, gender: 'Male' },

    // Admins (Founders and Members)
    { name: "Moosa Shaikh", email: "moosa.shaikh@example.com", phone: "8421708907", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Founder", "Lead Approver"], isActive: true, gender: 'Male' },
    { name: "Maaz Shaikh", email: "maaz.shaikh@example.com", phone: "9372145889", roles: ["Admin", "Finance Admin"], privileges: ["canManageDonations", "canViewFinancials"], groups: ["Finance"], isActive: true, gender: 'Male' },
    { name: "Abu Rehan Bedrekar", email: "aburehan.bedrekar@example.com", phone: "7276224160", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Co-Founder", "Lead Approver"], isActive: true, gender: 'Male' },
    { name: "Nayyar Ahmed Karajgi", email: "nayyar.karajgi@example.com", phone: "9028976036", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male' },
    { name: "Arif Baig", email: "arif.baig@example.com", phone: "9225747045", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male' },
    { name: "Mazhar Shaikh", email: "mazhar.shaikh@example.com", phone: "8087669914", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male' },
    { name: "Mujahid Chabukswar", email: "mujahid.chabukswar@example.com", phone: "8087420544", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male' },
    { name: "Muddasir", email: "muddasir@example.com", phone: "7385557820", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male' },
    
    // Generic Donor for Anonymous Donations
    { name: "Anonymous Donor", email: "anonymous@example.com", phone: "0000000000", roles: ["Donor"], privileges: [], isActive: true, gender: 'Other' },

    // Generic users for testing roles
    { name: "Aisha Khan", email: "aisha.khan@example.com", phone: "1234567890", roles: ["Donor", "Beneficiary"], privileges: [], isActive: true, gender: 'Female' },
    { name: "Beneficiary User", email: "beneficiary@example.com", phone: "0987654321", roles: ["Beneficiary"], privileges: [], isActive: true, gender: 'Female' },
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


export const seedDatabase = async (): Promise<{userResults: UserSeedResult[], orgStatus: string, error?: string}> => {
    console.log('Attempting to seed database...');
    if (!isConfigValid) {
        const errorMsg = "Firebase is not configured. Aborting seed.";
        console.error(errorMsg);
        return {
            userResults: [],
            orgStatus: 'Failed',
            error: errorMsg,
        }
    }
    try {
        const userResults = await seedUsers();
        const orgStatus = await seedOrganization();
        console.log('Database seeding process completed.');
        return { userResults, orgStatus };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred during seeding.';
        console.error('Error seeding database:', errorMsg);
        return {
            userResults: [],
            orgStatus: 'Failed',
            error: errorMsg,
        };
    }
};
