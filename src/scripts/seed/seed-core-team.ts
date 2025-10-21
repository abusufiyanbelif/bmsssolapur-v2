

import { seedUsers } from '@/services/seed-service';
import dotenv from 'dotenv';
import type { User } from '@/services/types';
import { performance } from 'perf_hooks';

dotenv.config();

// This list now EXCLUDES the main System Admin, as that user is created automatically
// on server startup in firebase-admin.ts to ensure system stability.
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
        roles: ["Admin", "Donor"], 
        privileges: ["canManageLeads"], 
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


async function run() {
  const startTime = performance.now();
  console.log('Seeding Core Team Members...');
  try {
    const result = await seedUsers(coreTeamUsersToSeed);
    console.log(`\n✅ SUCCESS: Core Team Seeding Complete`);
    if (result) {
        result.forEach(detail => console.log(`- ${detail}`));
    }
  } catch (e: any) {
    console.error('\n❌ ERROR: Failed to seed core team.');
    console.error('------------------------------------------');
    console.error('Error Details:', e.message);
    console.error('------------------------------------------');
    console.log('\nThis usually indicates a problem connecting to the database or a permissions issue. Please run `npm run test:db` to diagnose.');
  } finally {
    const endTime = performance.now();
    console.log(`\n✨ Done in ${((endTime - startTime) / 1000).toFixed(2)} seconds.`);
    process.exit();
  }
}

run();
