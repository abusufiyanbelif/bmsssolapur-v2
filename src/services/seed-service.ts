

/**
 * @fileOverview A service to seed the database with initial data.
 */

import { createUser, User, UserRole, getUserByName, getUserByPhone } from './user-service';
import { createOrganization, Organization } from './organization-service';
import { seedInitialQuotes } from './quotes-service';
import { db, isConfigValid } from './firebase';
import { collection, getDocs, query, where, Timestamp, setDoc, doc } from 'firebase/firestore';
import { Lead, Verifier, LeadPurpose, DonationType } from './lead-service';

const usersToSeed: Omit<User, 'id' | 'createdAt'>[] = [
    // Super Admin
    { name: "Abusufiyan Belif", email: "abusufiyan.belif@gmail.com", phone: "7887646583", roles: ["Super Admin", "Admin", "Donor", "Beneficiary"], privileges: ["all"], groups: ["Founder", "Co-Founder", "Finance", "Lead Approver"], isActive: true, gender: 'Male', address: '123 Admin Lane, Solapur', panNumber: 'ABCDE1234F', aadhaarNumber: '123456789012' },
    
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
];

const beneficiariesToSeed: Omit<User, 'id' | 'createdAt'>[] = [
    { name: 'Mustahik Person', email: 'mustahik.person@example.com', phone: '1000000001', roles: ['Beneficiary'], isActive: true, gender: 'Other' },
    { name: 'Hazrate Nomaniya Masjid', email: 'nomaniya.masjid@example.com', phone: '1000000002', roles: ['Beneficiary'], isActive: true, gender: 'Other' },
    { name: 'Ration Distribution', email: 'ration.distribution@example.com', phone: '1000000003', roles: ['Beneficiary'], isActive: true, gender: 'Other' },
    { name: 'Ration for 4 Houses', email: 'ration.4houses@example.com', phone: '1000000004', roles: ['Beneficiary'], isActive: true, gender: 'Other' },
    { name: 'Ration Aid', email: 'ration.aid@example.com', phone: '1000000005', roles: ['Beneficiary'], isActive: true, gender: 'Other' },
    { name: 'Madrasa Riaz Ul Jannah', email: 'riazul.jannah@example.com', phone: '1000000006', roles: ['Beneficiary'], isActive: true, gender: 'Other' },
    { name: 'Anonymous Help', email: 'anonymous.help@example.com', phone: '1000000007', roles: ['Beneficiary'], isActive: true, gender: 'Other' },
    { name: 'Lalsab Bagali', email: 'lalsab.bagali@example.com', phone: '1000000008', roles: ['Beneficiary'], isActive: true, gender: 'Male' },
    { name: 'Mustahiq Family', email: 'mustahiq.family@example.com', phone: '1000000009', roles: ['Beneficiary'], isActive: true, gender: 'Other' },
    { name: 'Child Hospital Bill', email: 'child.hospital@example.com', phone: '1000000010', roles: ['Beneficiary'], isActive: true, gender: 'Other' },
    { name: 'Madrasa Admission', email: 'madrasa.admission@example.com', phone: '1000000011', roles: ['Beneficiary'], isActive: true, gender: 'Other' },
    { name: 'Aid for Needy', email: 'aid.needy@example.com', phone: '1000000012', roles: ['Beneficiary'], isActive: true, gender: 'Other' },
    { name: 'Monthly Aid', email: 'monthly.aid@example.com', phone: '1000000013', roles: ['Beneficiary'], isActive: true, gender: 'Other' },
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

type LeadSeedData = Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'beneficiaryId' | 'adminAddedBy' | 'dateCreated' | 'name' | 'verifiers' | 'purpose' | 'subCategory'>;

const historicalLeadsToSeed: (LeadSeedData & { beneficiaryName: string })[] = [
    { beneficiaryName: 'Mustahik Person', helpRequested: 2004, helpGiven: 2004, category: 'Lillah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Alhamdulilaah ...Ek Mustahik Allah k bande ko 2004rs ka ration diya gya.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Hazrate Nomaniya Masjid', helpRequested: 4500, helpGiven: 4500, category: 'Sadaqah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Sound system for Masjid at New Vidi Gharkul Kumbhari Block A.', verificationDocumentUrl: '' },
    // Re-using the same beneficiary name for Nomaniya Masjid as it's the same entity
    { beneficiaryName: 'Hazrate Nomaniya Masjid', helpRequested: 720, helpGiven: 720, category: 'Deen', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Masjid light bill payment.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Ration Distribution', helpRequested: 2795, helpGiven: 2795, category: 'Lillah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Ration provided to a needy person.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Ration for 4 Houses', helpRequested: 5000, helpGiven: 5000, category: 'Lillah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Ration kits provided to 4 households, including elderly widows and sick families.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Ration Aid', helpRequested: 2000, helpGiven: 2000, category: 'Lillah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Grain provided to a person in need.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Madrasa Riaz Ul Jannah', helpRequested: 1800, helpGiven: 1800, category: 'Sadaqah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Rent and deposit for a new Madrasa at Sugar factory site new gharkul.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Anonymous Help', helpRequested: 1700, helpGiven: 1700, category: 'Lillah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Cash help provided to a person in need.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Lalsab Bagali', helpRequested: 29500, helpGiven: 29500, category: 'Sadaqah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Help for a patient\'s operation. 25000 cash given plus 4500 collected.', verificationDocumentUrl: '' },
    // Re-using Lalsab Bagali
    { beneficiaryName: 'Lalsab Bagali', helpRequested: 26800, helpGiven: 26800, category: 'Sadaqah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Hospital bill payment for a patient in need.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Mustahiq Family', helpRequested: 4000, helpGiven: 4000, category: 'Lillah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Money for household ration for a deserving family.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Child Hospital Bill', helpRequested: 3000, helpGiven: 3000, category: 'Sadaqah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Help for a sick 2-year-old child admitted to the government hospital.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Madrasa Admission', helpRequested: 600, helpGiven: 600, category: 'Sadaqah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Admission fee for a 9-year-old boy from a new Muslim family in a school cum madrasa.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Aid for Needy', helpRequested: 6000, helpGiven: 6000, category: 'Lillah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Follow-up help provided to a previously supported case.', verificationDocumentUrl: '' },
    { beneficiaryName: 'Monthly Aid', helpRequested: 4000, helpGiven: 4000, category: 'Lillah', isLoan: false, status: 'Closed', verifiedStatus: 'Verified', caseDetails: 'Monthly financial assistance to a deserving person.', verificationDocumentUrl: '' },
];


export type SeedItemResult = { name: string; status: 'Created' | 'Skipped (already exists)' };
export type SeedResult = {
    userResults: SeedItemResult[];
    orgStatus: string;
    quotesStatus: string;
    leadResults: SeedItemResult[];
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

        const q = query(collection(db, 'users'), where("phone", "==", userData.phone));
        const existingUsers = await getDocs(q);
        
        if (existingUsers.empty) {
            await createUser({
                ...userData,
                createdAt: Timestamp.now()
            });
            results.push({ name: userData.name, status: 'Created' });
        } else {
            results.push({ name: userData.name, status: 'Skipped (already exists)' });
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

const seedLeads = async (): Promise<SeedItemResult[]> => {
    if (!isConfigValid) {
        throw new Error("Firebase is not configured. Cannot seed leads.");
    }
    console.log('Seeding historical leads...');
    const results: SeedItemResult[] = [];
    
    const historicalAdmin = await getUserByPhone("8421708907"); // Moosa Shaikh

     if (!historicalAdmin) {
        throw new Error("Cannot seed historical leads without 'Moosa Shaikh' (8421708907) user.");
    }

    const leadsCollection = collection(db, 'leads');
    const historicalDate = Timestamp.fromDate(new Date("2021-12-01"));

    for (const leadData of historicalLeadsToSeed) {
        // Check if a similar lead exists already to prevent duplicates
        const q = query(leadsCollection, where("caseDetails", "==", leadData.caseDetails), where("helpRequested", "==", leadData.helpRequested));
        const existingLeads = await getDocs(q);
        
        if (existingLeads.empty) {
            const beneficiaryUser = await getUserByName(leadData.beneficiaryName);
            if (!beneficiaryUser) {
                console.warn(`Could not find beneficiary user "${leadData.beneficiaryName}" for lead. Skipping.`);
                results.push({ name: leadData.beneficiaryName, status: 'Skipped (already exists)' });
                continue;
            }

            const leadRef = doc(leadsCollection);
            const verifier: Verifier = {
                verifierId: historicalAdmin.id!,
                verifierName: historicalAdmin.name,
                verifiedAt: historicalDate,
                notes: "Verified as part of historical data import."
            };
            const newLead: Lead = {
                ...leadData,
                id: leadRef.id,
                name: beneficiaryUser.name,
                beneficiaryId: beneficiaryUser.id!,
                adminAddedBy: historicalAdmin.id!,
                verifiers: [verifier],
                dateCreated: historicalDate,
                createdAt: historicalDate,
                updatedAt: historicalDate,
            };
            await setDoc(leadRef, newLead);
            results.push({ name: newLead.name, status: 'Created' });
        } else {
            results.push({ name: leadData.beneficiaryName, status: 'Skipped (already exists)' });
        }
    }

    console.log('Lead seeding process finished.');
    return results;
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
            leadResults: [],
            error: errorMsg,
        }
    }
    try {
        console.log("Seeding core admin users...");
        const adminUserResults = await seedUsers(usersToSeed);
        console.log("Seeding beneficiary users...");
        const beneficiaryUserResults = await seedUsers(beneficiariesToSeed);
        const userResults = [...adminUserResults, ...beneficiaryUserResults];
        
        const orgStatus = await seedOrganization();
        const quotesStatus = await seedInitialQuotes();
        const leadResults = await seedLeads();
        console.log('Database seeding process completed.');
        return { userResults, orgStatus, quotesStatus, leadResults };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred during seeding.';
        console.error('Error seeding database:', errorMsg);
        return {
            userResults: [],
            orgStatus: 'Failed',
            quotesStatus: 'Failed',
            leadResults: [],
            error: errorMsg,
        };
    }
};
