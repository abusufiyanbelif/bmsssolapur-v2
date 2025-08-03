

/**
 * @fileOverview A service to seed the database with initial data.
 */

import { createUser, User, UserRole, getUserByName, getUserByPhone, getAllUsers, updateUser } from './user-service';
import { createOrganization, Organization, getCurrentOrganization } from './organization-service';
import { seedInitialQuotes } from './quotes-service';
import { db, isConfigValid } from './firebase';
import { collection, getDocs, query, where, Timestamp, setDoc, doc, writeBatch } from 'firebase/firestore';
import type { Lead, Verifier, LeadDonationAllocation, Donation } from './types';

const adminUsersToSeed: Omit<User, 'id' | 'createdAt'>[] = [
    // Super Admin
    { name: "admin", email: "admin@example.com", phone: "9999999999", password: "admin1", roles: ["Super Admin"], privileges: ["all"], groups: ["Founder"], isActive: true, gender: 'Other' },
    { name: "Abusufiyan Belif", email: "abusufiyan.belif@gmail.com", phone: "7887646583", password: "admin1", roles: ["Super Admin", "Admin", "Donor", "Beneficiary"], privileges: ["all"], groups: ["Member of Organization", "Lead Approver"], isActive: true, gender: 'Male', address: { addressLine1: '123 Admin Lane', city: 'Solapur', state: 'Maharashtra', country: 'India', pincode: '413001' }, panNumber: 'ABCDE1234F', aadhaarNumber: '123456789012' },
    
    // Admins (Founders and Members)
    { name: "Moosa Shaikh", email: "moosa.shaikh@example.com", phone: "8421708907", password: "admin", roles: ["Admin", "Donor"], privileges: ["canManageLeads"], groups: ["Founder", "Lead Approver"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
    { name: "Maaz Shaikh", email: "maaz.shaikh@example.com", phone: "9372145889", password: "admin", roles: ["Admin", "Finance Admin", "Donor"], privileges: ["canManageDonations", "canViewFinancials"], groups: ["Finance", "Lead Approver"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
    { name: "Abu Rehan Bedrekar", email: "aburehan.bedrekar@example.com", phone: "7276224160", password: "admin", roles: ["Admin", "Donor"], privileges: ["canManageLeads"], groups: ["Co-Founder", "Lead Approver"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
    { name: "Nayyar Ahmed Karajgi", email: "nayyar.karajgi@example.com", phone: "9028976036", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
    { name: "Arif Baig", email: "arif.baig@example.com", phone: "9225747045", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
    { name: "Mazhar Shaikh", email: "mazhar.shaikh@example.com", phone: "8087669914", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
    { name: "Mujahid Chabukswar", email: "mujahid.chabukswar@example.com", phone: "8087420544", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
    { name: "Muddasir", email: "muddasir@example.com", phone: "7385557820", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
    
    // Generic Donor for Anonymous Donations
    { name: "Anonymous Donor", email: "anonymous@example.com", phone: "0000000000", password: "admin", roles: ["Donor"], privileges: [], groups: [], isActive: true, gender: 'Other' },

    // Hardcoded Donor user
    { name: "Donor", email: "donor@example.com", phone: "1111111111", password: "donor", roles: ["Donor"], privileges: [], groups: [], isActive: true, gender: 'Other', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },

    // Hardcoded Beneficiary user
    { name: "Beneficiary", email: "beneficiary@example.com", phone: "2222222222", password: "admin", roles: ["Beneficiary"], privileges: [], groups: [], isActive: true, gender: 'Other', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
];

const historicalLeadsToSeed: (Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'beneficiaryId' | 'adminAddedBy' | 'dateCreated' | 'name' | 'verifiers' | 'donations' | 'purpose' | 'subCategory'> & { beneficiaryName: string; beneficiaryPhone: string; })[] = [
    { beneficiaryName: 'Mustahik Person', beneficiaryPhone: '1000000001', helpRequested: 2004, helpGiven: 2004, category: 'Lillah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Alhamdulilaah ...Ek Mustahik Allah k bande ko 2004rs ka ration diya gya.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Hazrate Nomaniya Masjid', beneficiaryPhone: '1000000002', helpRequested: 4500, helpGiven: 4500, category: 'Sadaqah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Sound system for Masjid at New Vidi Gharkul Kumbhari Block A.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Hazrate Nomaniya Masjid Bill', beneficiaryPhone: '1000000003', helpRequested: 720, helpGiven: 720, category: 'Sadaqah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Masjid light bill payment.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Ration Distribution', beneficiaryPhone: '1000000004', helpRequested: 2795, helpGiven: 2795, category: 'Lillah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Ration provided to a needy person.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Ration for 4 Houses', beneficiaryPhone: '1000000005', helpRequested: 5000, helpGiven: 5000, category: 'Lillah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Ration kits provided to 4 households, including elderly widows and sick families.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Ration Aid', beneficiaryPhone: '1000000006', helpRequested: 2000, helpGiven: 2000, category: 'Lillah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Grain provided to a person in need.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Madrasa Riaz Ul Jannah', beneficiaryPhone: '1000000007', helpRequested: 1800, helpGiven: 1800, category: 'Sadaqah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Rent and deposit for a new Madrasa at Sugar factory site new gharkul.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Anonymous Help', beneficiaryPhone: '1000000008', helpRequested: 1700, helpGiven: 1700, category: 'Lillah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Cash help provided to a person in need.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Lalsab Bagali Operation', beneficiaryPhone: '1000000009', helpRequested: 29500, helpGiven: 29500, category: 'Sadaqah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Help for a patient\'s operation. 25000 cash given plus 4500 collected.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Lalsab Bagali Bill', beneficiaryPhone: '1000000010', helpRequested: 26800, helpGiven: 26800, category: 'Sadaqah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Hospital bill payment for a patient in need.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Mustahiq Family', beneficiaryPhone: '1000000011', helpRequested: 4000, helpGiven: 4000, category: 'Lillah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Money for household ration for a deserving family.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Child Hospital Bill', beneficiaryPhone: '1000000012', helpRequested: 3000, helpGiven: 3000, category: 'Sadaqah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Help for a sick 2-year-old child admitted to the government hospital.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Madrasa Admission', beneficiaryPhone: '1000000013', helpRequested: 600, helpGiven: 600, category: 'Sadaqah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Admission fee for a 9-year-old boy from a new Muslim family in a school cum madrasa.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Aid for Needy', beneficiaryPhone: '1000000014', helpRequested: 6000, helpGiven: 6000, category: 'Lillah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Follow-up help provided to a previously supported case.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Monthly Aid', beneficiaryPhone: '1000000015', helpRequested: 4000, helpGiven: 4000, category: 'Lillah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Monthly financial assistance to a deserving person.', verificationDocumentUrl: '' },
];


const organizationToSeed: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> = {
    name: "BAITULMAL SAMAJIK SANSTHA SOLAPUR",
    city: "Solapur",
    address: "Solapur, Maharashtra, India",
    registrationNumber: "MAHA/123/2024",
    panNumber: "AAFTB9401P",
    contactEmail: "contact@baitulmalsolapur.org",
    contactPhone: "919372145889",
    website: "https://baitulmalsolapur.org",
    upiId: "919372145889@paytm",
    qrCodeUrl: "https://placehold.co/200x200.png",
};

export type SeedItemResult = { name: string; status: 'Created' | 'Updated' | 'Skipped (already exists)' | 'Failed' };
export type SeedResult = {
    userResults: SeedItemResult[];
    donationResults: SeedItemResult[];
    leadResults: SeedItemResult[];
    orgStatus: string;
    quotesStatus: string;
    error?: string;
};

const seedUsers = async (users: Omit<User, 'id' | 'createdAt'>[]): Promise<SeedItemResult[]> => {
    if (!isConfigValid) {
        throw new Error("Firebase is not configured. Cannot seed users.");
    }
    const results: SeedItemResult[] = [];

    for (const userData of users) {
        // Hardcode Super Admin to be active to prevent lockouts.
        if (userData.roles.includes('Super Admin')) {
            userData.isActive = true;
        }

        const existingUser = await getUserByPhone(userData.phone);
        
        if (existingUser) {
             // User exists, update them with the seed data
            await updateUser(existingUser.id!, {
                roles: userData.roles,
                password: userData.password,
                groups: userData.groups || [],
                privileges: userData.privileges || [],
                isActive: userData.isActive,
            });
            results.push({ name: userData.name, status: 'Updated' });

        } else {
            // User does not exist, create them
            await createUser({
                ...userData,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            results.push({ name: userData.name, status: 'Created' });
        }
    }
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


const seedDonationsAndLeads = async (): Promise<{ donationResults: SeedItemResult[], leadResults: SeedItemResult[] }> => {
    if (!isConfigValid) {
        throw new Error("Firebase is not configured.");
    }

    console.log('Seeding historical donations and leads...');
    let donationResults: SeedItemResult[] = [];
    let leadResults: SeedItemResult[] = [];

    const allUsers = await getAllUsers();
    let donorUsers = allUsers.filter(u => u.roles.includes('Donor') && u.name !== 'Anonymous Donor');

    if (donorUsers.length === 0) {
        console.warn("No real donor users found. Donations will be assigned to Super Admins if possible.");
        const superAdmins = allUsers.filter(u => u.roles.includes('Super Admin'));
        if (superAdmins.length === 0) {
            throw new Error("Cannot seed donations. No users with 'Donor' or 'Super Admin' role found.");
        }
        donorUsers = superAdmins; // Fallback to super admins as donors
    }
    
    const historicalAdmin = await getUserByPhone("8421708907"); 
    if (!historicalAdmin) {
        throw new Error("Cannot seed historical data. The user 'Moosa Shaikh' (phone: 8421708907) must exist to act as the verifier for past leads.");
    }
    
    const q = query(collection(db, 'leads'));
    const existingLeads = await getDocs(q);
    if (!existingLeads.empty) {
        console.log("Leads collection is not empty. Skipping lead and donation seeding.");
        return {
            donationResults: [{ name: 'Historical Donations', status: 'Skipped (already exists)' }],
            leadResults: [{ name: 'Historical Leads', status: 'Skipped (already exists)' }],
        };
    }

    const batch = writeBatch(db);
    const leadsCollection = collection(db, 'leads');
    const donationsCollection = collection(db, 'donations');

    for (const leadData of historicalLeadsToSeed) {
        let beneficiaryUser = await getUserByPhone(leadData.beneficiaryPhone);

        if (!beneficiaryUser) {
            console.log(`Beneficiary ${leadData.beneficiaryName} with phone ${leadData.beneficiaryPhone} not found, creating...`);
            beneficiaryUser = await createUser({
                name: leadData.beneficiaryName,
                phone: leadData.beneficiaryPhone,
                roles: ['Beneficiary'],
                password: 'admin',
                isActive: true,
                createdAt: Timestamp.fromDate(new Date("2021-11-01")),
                updatedAt: Timestamp.fromDate(new Date("2021-11-01")),
            });
        }
        
        const randomDonor = donorUsers[Math.floor(Math.random() * donorUsers.length)];
        const donationRef = doc(donationsCollection);
        const donation: Donation = {
            id: donationRef.id,
            donorId: randomDonor.id!,
            donorName: randomDonor.name,
            amount: leadData.helpGiven,
            type: leadData.category,
            purpose: 'Loan and Relief Fund',
            status: 'Allocated',
            isAnonymous: false,
            transactionId: `HISTORICAL-${Date.now()}-${Math.random()}`,
            paymentScreenshotUrl: '',
            createdAt: Timestamp.fromDate(new Date("2021-11-01")),
            verifiedAt: Timestamp.fromDate(new Date("2021-11-01")),
            notes: 'Historical donation seeded automatically.'
        };
        batch.set(donationRef, donation);
        donationResults.push({ name: `Donation from ${randomDonor.name} for ${leadData.helpGiven}`, status: 'Created' });
        
        const leadRef = doc(leadsCollection);
        const verifier: Verifier = {
            verifierId: historicalAdmin.id!,
            verifierName: historicalAdmin.name,
            verifiedAt: Timestamp.fromDate(new Date("2021-12-01")),
            notes: "Verified as part of historical data import."
        };
        const leadDonationAllocation: LeadDonationAllocation = {
            donationId: donation.id!,
            amount: leadData.helpGiven,
        };

        const newLead: Lead = {
            id: leadRef.id,
            name: beneficiaryUser.name,
            beneficiaryId: beneficiaryUser.id!,
            helpRequested: leadData.helpRequested,
            helpGiven: leadData.helpGiven,
            status: leadData.status,
            isLoan: leadData.isLoan,
            caseDetails: leadData.caseDetails,
            verificationDocumentUrl: leadData.verificationDocumentUrl,
            verifiedStatus: leadData.verifiedStatus,
            verifiers: [verifier],
            donations: [leadDonationAllocation],
            adminAddedBy: historicalAdmin.id!,
            dateCreated: Timestamp.fromDate(new Date("2021-12-01")),
            createdAt: Timestamp.fromDate(new Date("2021-12-01")),
            updatedAt: Timestamp.fromDate(new Date("2021-12-01")),
            category: leadData.category,
            purpose: 'Relief Fund',
        };
        
        batch.set(leadRef, newLead);
        leadResults.push({ name: `Lead for ${newLead.name}`, status: 'Created' });

        const updatedDonationAllocation = {
            leadId: newLead.id!,
            amount: leadData.helpGiven,
            allocatedAt: Timestamp.fromDate(new Date("2021-12-01")),
        };
        batch.update(donationRef, { allocations: [updatedDonationAllocation] });
    }
    
    await batch.commit();
    console.log('Donation and Lead seeding process finished.');
    return { donationResults, leadResults };
};


export const seedDatabase = async (): Promise<SeedResult> => {
    console.log('Attempting to seed database...');
    if (!isConfigValid) {
        const errorMsg = "Firebase is not configured. Aborting seed.";
        console.error(errorMsg);
        return {
            userResults: [],
            donationResults: [],
            leadResults: [],
            orgStatus: 'Failed',
            quotesStatus: 'Failed',
            error: errorMsg,
        }
    }
    try {
        console.log("Seeding core admin users...");
        const userResults = await seedUsers(adminUsersToSeed);
        
        const orgStatus = await seedOrganization();
        const quotesStatus = await seedInitialQuotes();
        const { donationResults, leadResults } = await seedDonationsAndLeads();
        
        console.log('Database seeding process completed.');
        return { userResults, orgStatus, quotesStatus, leadResults, donationResults };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred during seeding.';
        console.error('Error seeding database:', errorMsg);
        return {
            userResults: [],
            donationResults: [],
            leadResults: [],
            orgStatus: 'Failed',
            quotesStatus: 'Failed',
            error: errorMsg,
        };
    }
};

    

    
