/**
 * @fileOverview A service to seed the database with initial data.
 */

import { createUser, User } from './user-service';

const usersToSeed: Omit<User, 'createdAt' | 'id'>[] = [
    // Super Admins
    { name: "Moosa Shaikh", email: "moosa.shaikh@example.com", phone: "8421708907", role: "Founder", privileges: ["Super Admin"] },
    { name: "Maaz Shaikh", email: "maaz.shaikh@example.com", phone: "9372145889", role: "Finance Team", privileges: ["Super Admin"] },
    { name: "Abu Rehan Bedrekar", email: "aburehan.bedrekar@example.com", phone: "7276224160", role: "Co-Founder", privileges: ["Super Admin"] },
    { name: "Abusufiyan Belif", email: "abusufiyan.belif@gmail.com", phone: "7887646583", role: "Super Admin and Member of Organization", privileges: ["Super Admin"] },
    // Admins
    { name: "Nayyar Ahmed Karajgi", email: "nayyar.karajgi@example.com", phone: "9028976036", role: "Member of Organization", privileges: ["Admin"] },
    { name: "Arif Baig", email: "arif.baig@example.com", phone: "9225747045", role: "Member of Organization", privileges: ["Admin"] },
    { name: "Mazhar Shaikh", email: "mazhar.shaikh@example.com", phone: "8087669914", role: "Member of Organization", privileges: ["Admin"] },
    { name: "Mujahid Chabukswar", email: "mujahid.chabukswar@example.com", phone: "8087420544", role: "Member of Organization", privileges: ["Admin"] },
    { name: "Muddasir", email: "muddasir@example.com", phone: "7385557820", role: "Member of Organization", privileges: ["Admin"] },
    // Generic Donor for Anonymous Donations
    { name: "Anonymous Donor", email: "anonymous@example.com", phone: "0000000000", role: "Donor", privileges: [] },
];


export const seedDatabase = async () => {
    console.log('Seeding database...');
    try {
        for (const userData of usersToSeed) {
            // In a real app, we'd check if the user exists before creating
            // For this seeder, we'll just create them.
            await createUser({
                ...userData,
                createdAt: new Date(),
            } as User);
        }
        console.log('Database seeded successfully.');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};
