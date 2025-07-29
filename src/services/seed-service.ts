/**
 * @fileOverview A service to seed the database with initial data.
 */

import { createUser, User, UserRole } from './user-service';
import { createOrganization, Organization } from './organization-service';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

const usersToSeed: Omit<User, 'createdAt' | 'id'>[] = [
    // Super Admins
    { name: "Abusufiyan Belif", email: "abusufiyan.belif@gmail.com", phone: "7887646583", roles: ["Super Admin", "Admin", "Donor", "Beneficiary"], privileges: ["Super Admin"] },
    { name: "Super Admin", email: "admin@baitulmalsolapur.org", phone: "1111111111", roles: ["Super Admin"], privileges: ["Super Admin"] },
    
    // Admins (Founders and Members)
    { name: "Moosa Shaikh", email: "moosa.shaikh@example.com", phone: "8421708907", roles: ["Admin"], privileges: ["Admin"], groups: ["Founder"] },
    { name: "Maaz Shaikh", email: "maaz.shaikh@example.com", phone: "9372145889", roles: ["Admin", "Finance"], privileges: ["Admin"], groups: ["Finance Team"] },
    { name: "Abu Rehan Bedrekar", email: "aburehan.bedrekar@example.com", phone: "7276224160", roles: ["Admin"], privileges: ["Admin"], groups: ["Co-Founder"] },
    { name: "Nayyar Ahmed Karajgi", email: "nayyar.karajgi@example.com", phone: "9028976036", roles: ["Admin"], privileges: ["Admin"], groups: ["Member of Organization"] },
    { name: "Arif Baig", email: "arif.baig@example.com", phone: "9225747045", roles: ["Admin"], privileges: ["Admin"], groups: ["Member of Organization"] },
    { name: "Mazhar Shaikh", email: "mazhar.shaikh@example.com", phone: "8087669914", roles: ["Admin"], privileges: ["Admin"], groups: ["Member of Organization"] },
    { name: "Mujahid Chabukswar", email: "mujahid.chabukswar@example.com", phone: "8087420544", roles: ["Admin"], privileges: ["Admin"], groups: ["Member of Organization"] },
    { name: "Muddasir", email: "muddasir@example.com", phone: "7385557820", roles: ["Admin"], privileges: ["Admin"], groups: ["Member of Organization"] },
    
    // Generic Donor for Anonymous Donations
    { name: "Anonymous Donor", email: "anonymous@example.com", phone: "0000000000", roles: ["Donor"], privileges: [] },
];

const organizationToSeed: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> = {
    name: "Baitul Mal Samajik Sanstha (Solapur)",
    city: "Solapur",
    address: "Solapur, Maharashtra, India",
    registrationNumber: "MAHA/123/2024",
    contactEmail: "contact@baitulmalsolapur.org",
    contactPhone: "+91 12345 67890",
    website: "https://baitulmalsolapur.org"
};

const seedUsers = async () => {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    if (!snapshot.empty) {
        console.log('Users collection already has documents. Skipping user seeding.');
        return;
    }

    console.log('Seeding users...');
    for (const userData of usersToSeed) {
        await createUser({
            ...userData,
            createdAt: new Date(),
        } as User);
    }
};

const seedOrganization = async () => {
    const orgsCollection = collection(db, 'organizations');
    const snapshot = await getDocs(orgsCollection);
    if (!snapshot.empty) {
        console.log('Organizations collection already has documents. Skipping organization seeding.');
        return;
    }
    
    console.log('Seeding organization...');
    await createOrganization(organizationToSeed);
};


export const seedDatabase = async () => {
    console.log('Seeding database...');
    try {
        await seedUsers();
        await seedOrganization();
        console.log('Database seeded successfully.');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};
