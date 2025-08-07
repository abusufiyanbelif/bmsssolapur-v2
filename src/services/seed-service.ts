

/**
 * @fileOverview A service to seed the database with initial data.
 */

import { createUser, User, UserRole, getUserByEmail, getUserByPhone, getAllUsers, updateUser, getUser, getUserByUserId } from './user-service';
import { createOrganization, Organization, getCurrentOrganization } from './organization-service';
import { seedInitialQuotes } from './quotes-service';
import { db, isConfigValid } from './firebase';
import { collection, getDocs, query, where, Timestamp, setDoc, doc, writeBatch } from 'firebase/firestore';
import type { Lead, Verifier, LeadDonationAllocation, Donation, Campaign } from './types';

const adminUsersToSeed: Omit<User, 'id' | 'createdAt'>[] = [
    // Super Admin
    { name: "admin", userId: "admin.user", firstName: "Admin", lastName: "User", email: "admin@example.com", phone: "9999999999", password: "admin", roles: ["Super Admin"], privileges: ["all"], groups: ["Founder"], isActive: true, gender: 'Other' },
    { name: "Abusufiyan Belif", userId: "abusufiyan.belif", firstName: "Abusufiyan", middleName: "", lastName: "Belif", email: "abusufiyan.belif@gmail.com", phone: "7887646583", password: "admin", roles: ["Super Admin", "Admin", "Donor", "Beneficiary"], privileges: ["all"], groups: ["Member of Organization", "Lead Approver"], isActive: true, gender: 'Male', address: { addressLine1: '123 Admin Lane', city: 'Solapur', state: 'Maharashtra', country: 'India', pincode: '413001' }, panNumber: 'ABCDE1234F', aadhaarNumber: '123456789012' },
    
    // Admins (Founders and Members)
    { name: "Moosa Shaikh", userId: "moosa.shaikh", firstName: "Moosa", middleName: "", lastName: "Shaikh", email: "moosa.shaikh@example.com", phone: "8421708907", password: "admin", roles: ["Admin", "Donor"], privileges: ["canManageLeads"], groups: ["Founder", "Lead Approver"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
    { name: "Maaz Shaikh", userId: "maaz.shaikh", firstName: "Maaz", middleName: "", lastName: "Shaikh", email: "maaz.shaikh@example.com", phone: "9372145889", password: "admin", roles: ["Admin", "Finance Admin", "Donor"], privileges: ["canManageDonations", "canViewFinancials"], groups: ["Finance", "Lead Approver"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
    { name: "AbuRehan Bedrekar", userId: "aburehan.bedrekar", firstName: "AbuRehan", middleName: "", lastName: "Bedrekar", email: "aburehan.bedrekar@example.com", phone: "7276224160", password: "admin", roles: ["Admin", "Donor"], privileges: ["canManageLeads"], groups: ["Co-Founder", "Lead Approver"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
    { name: "NayyarAhmed Karajgi", userId: "nayyarahmed.karajgi", firstName: "NayyarAhmed", middleName: "", lastName: "Karajgi", email: "nayyar.karajgi@example.com", phone: "9028976036", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
    { name: "Arif Baig", userId: "arif.baig", firstName: "Arif", middleName: "", lastName: "Baig", email: "arif.baig@example.com", phone: "9225747045", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
    { name: "Mazhar Shaikh", userId: "mazhar.shaikh", firstName: "Mazhar", middleName: "", lastName: "Shaikh", email: "mazhar.shaikh@example.com", phone: "8087669914", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
    { name: "Mujahid Chabukswar", userId: "mujahid.chabukswar", firstName: "Mujahid", middleName: "", lastName: "Chabukswar", email: "mujahid.chabukswar@example.com", phone: "8087420544", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
    { name: "Muddasir Shaikh", userId: "muddasir.shaikh", firstName: "Muddasir", middleName: "", lastName: "Shaikh", email: "muddasir@example.com", phone: "7385557820", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
    
    // Generic Donors & Beneficiaries
    { name: "Anonymous Donor", userId: "anonymous.donor", firstName: "Anonymous", middleName: "", lastName: "Donor", email: "anonymous@example.com", phone: "0000000000", password: "admin", roles: ["Donor"], isAnonymousAsDonor: true, privileges: [], groups: [], isActive: true, gender: 'Other' },
    { name: "Anonymous Beneficiary", userId: "anonymous.beneficiary", firstName: "Anonymous", lastName: "Beneficiary", email: "anonymous.beneficiary@example.com", phone: "0000000001", password: "admin", roles: ["Beneficiary"], isAnonymousAsBeneficiary: true, isActive: true, gender: 'Other' },
    { name: "Anonymous User Both", userId: "anonymous.user.both", firstName: "AnonymousBoth", lastName: "User", email: "anonymous.both@example.com", phone: "3333333333", password: "admin", roles: ["Beneficiary", "Donor"], isAnonymousAsBeneficiary: true, isAnonymousAsDonor: true, isActive: true, gender: 'Other' },
    
    // Hardcoded Donor user, now also a Super Admin for testing
    { name: "Donor User", userId: "donor.user", firstName: "Donor", middleName: "", lastName: "User", email: "donor@example.com", phone: "1111111111", password: "admin", roles: ["Donor", "Super Admin"], privileges: ["all"], groups: [], isActive: true, gender: 'Other', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },

    // Hardcoded Beneficiary user
    { name: "Beneficiary User", userId: "beneficiary.user", firstName: "Beneficiary", middleName: "", lastName: "User", email: "beneficiary@example.com", phone: "2222222222", password: "admin", roles: ["Beneficiary"], privileges: [], groups: [], isActive: true, gender: 'Other', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' } },
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
    upiId: "9372145889@paytm",
    qrCodeUrl: "https://storage.googleapis.com/static.invertase.io/assets/phonepe-qr-code.png",
};


// RAMADAN CAMPAIGN DATA
const ramadanCampaignUsers: Omit<User, 'id' | 'createdAt'>[] = [
    { name: "Salim Operation", userId: "salim.operation", firstName: "Salim", lastName: "Operation", email: "salim.op@example.com", phone: "4444444401", password: "admin", roles: ["Beneficiary"], isActive: true, gender: 'Male', beneficiaryType: 'Adult' },
    ...Array.from({ length: 10 }, (_, i) => ({
        name: `Ration Family ${i + 1}`,
        userId: `ration.family.${i + 1}`,
        firstName: `RationFamily${i+1}`,
        lastName: "User",
        email: `ration${i+1}@example.com`,
        phone: `55555555${i.toString().padStart(2, '0')}`,
        password: "admin",
        roles: ["Beneficiary"],
        isActive: true,
        gender: 'Other',
        beneficiaryType: 'Family' as 'Family'
    }))
];


const ramadanCampaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'> = {
    name: "Ramadan 2025 Zakat Drive",
    description: "A campaign to collect Zakat during Ramadan 2025 to help with critical operations and provide ration kits to families in need.",
    goal: 150000,
    status: 'Completed',
    startDate: Timestamp.fromDate(new Date("2025-03-01")),
    endDate: Timestamp.fromDate(new Date("2025-03-30")),
};

const historicalLeadsToSeed: (Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'beneficiaryId' | 'adminAddedBy' | 'dateCreated' | 'name' | 'verifiers' | 'donations' | 'purpose' | 'donationType'> & { beneficiaryName: string; beneficiaryPhone: string; })[] = [
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


export type SeedItemResult = { name: string; status: 'Created' | 'Updated' | 'Skipped (already exists)' | 'Failed' };
export type SeedResult = {
    userResults: SeedItemResult[];
    donationResults: SeedItemResult[];
    leadResults: SeedItemResult[];
    campaignResults: SeedItemResult[];
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

        const id = userData.userId; // Use the hardcoded ID
        if (!id) {
            results.push({ name: userData.name, status: 'Failed' });
            console.error(`User ${userData.name} is missing a userId in the seed data.`);
            continue;
        }
        
        // Find user by any unique identifier to decide if they exist
        let existingUser: User | null = null;
        if (userData.userId) {
            existingUser = await getUserByUserId(userData.userId);
        }
        if (!existingUser && userData.email) {
            existingUser = await getUserByEmail(userData.email);
        }
        if (!existingUser) {
            existingUser = await getUserByPhone(userData.phone);
        }
        
        if (existingUser) {
             // User exists, update them with the seed data.
             // This ensures that any changes to the seed data are reflected.
            await updateUser(existingUser.id!, userData);
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
    
    const q = query(collection(db, 'leads'), where("campaignId", "==", null));
    const existingLeads = await getDocs(q);
    if (!existingLeads.empty) {
        console.log("General leads exist. Skipping general lead and donation seeding.");
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
            const [firstName, ...lastNameParts] = leadData.beneficiaryName.split(' ');
            const lastName = lastNameParts.join(' ');
            beneficiaryUser = await createUser({
                name: leadData.beneficiaryName,
                firstName: firstName || 'Historical',
                lastName: lastName || 'User',
                userId: leadData.beneficiaryName.toLowerCase().replace(/\s+/g, '.'),
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
            type: leadData.category as any,
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
            allocatedAt: Timestamp.fromDate(new Date("2021-12-01")),
            allocatedByUserId: historicalAdmin.id!,
            allocatedByUserName: historicalAdmin.name,
        };

        const newLead: Lead = {
            id: leadRef.id,
            name: beneficiaryUser.name,
            beneficiaryId: beneficiaryUser.id!,
            helpRequested: leadData.helpRequested,
            helpGiven: leadData.helpGiven,
            status: leadData.status as Lead['status'],
            isLoan: leadData.isLoan,
            caseDetails: leadData.caseDetails,
            verificationDocumentUrl: leadData.verificationDocumentUrl,
            verifiedStatus: leadData.verifiedStatus as Lead['verifiedStatus'],
            verifiers: [verifier],
            donations: [leadDonationAllocation],
            adminAddedBy: { id: historicalAdmin.id!, name: historicalAdmin.name },
            dateCreated: Timestamp.fromDate(new Date("2021-12-01")),
            createdAt: Timestamp.fromDate(new Date("2021-12-01")),
            updatedAt: Timestamp.fromDate(new Date("2021-12-01")),
            category: leadData.category,
            purpose: 'Relief Fund',
            donationType: 'Lillah',
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


const seedCampaignsAndLinkedLeads = async (): Promise<{ campaignResults: SeedItemResult[], leadResults: SeedItemResult[], donationResults: SeedItemResult[] }> => {
    if (!isConfigValid) throw new Error("Firebase is not configured.");

    const campaignResults: SeedItemResult[] = [];
    const leadResults: SeedItemResult[] = [];
    const donationResults: SeedItemResult[] = [];

    const existingCampaignQuery = query(collection(db, 'campaigns'), where("name", "==", ramadanCampaign.name));
    const existingCampaignSnapshot = await getDocs(existingCampaignQuery);
    if (!existingCampaignSnapshot.empty) {
        campaignResults.push({ name: ramadanCampaign.name, status: 'Skipped (already exists)' });
        return { campaignResults, leadResults, donationResults };
    }

    const batch = writeBatch(db);
    
    // 1. Create Campaign
    const campaignRef = doc(collection(db, 'campaigns'));
    batch.set(campaignRef, { ...ramadanCampaign, id: campaignRef.id, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
    campaignResults.push({ name: ramadanCampaign.name, status: 'Created' });

    const verifierAdmin = await getUserByPhone("7887646583");
    if (!verifierAdmin) {
        throw new Error("Verifier admin (7887646583) not found for Ramadan campaign seeding.");
    }
    const verifier: Verifier = {
        verifierId: verifierAdmin.id!,
        verifierName: verifierAdmin.name,
        verifiedAt: Timestamp.now(),
        notes: "Verified as part of historical campaign data import."
    };
    
    let allDonors = await getAllUsers();
    allDonors = allDonors.filter(u => u.roles.includes('Donor') && u.name !== 'Anonymous Donor');
    if (allDonors.length === 0) throw new Error("No donor users found for campaign seeding.");

    // 2. Create Beneficiaries, Leads, and Donations for the campaign
    // Individual Lead for Operation
    const medicalBeneficiary = await getUserByPhone(ramadanCampaignUsers[0].phone);
    if (medicalBeneficiary) {
        const medicalLeadRef = doc(collection(db, 'leads'));
        const medicalDonationRef = doc(collection(db, 'donations'));
        const randomDonor = allDonors[Math.floor(Math.random() * allDonors.length)];
        
        batch.set(medicalDonationRef, {
            id: medicalDonationRef.id,
            donorId: randomDonor.id!, donorName: randomDonor.name, amount: 60000,
            type: 'Zakat', purpose: 'Medical', status: 'Allocated', isAnonymous: false,
            createdAt: Timestamp.now(), verifiedAt: Timestamp.now()
        });
        donationResults.push({ name: `Donation for ${medicalBeneficiary.name}`, status: 'Created' });
        
        batch.set(medicalLeadRef, {
            id: medicalLeadRef.id, name: medicalBeneficiary.name, beneficiaryId: medicalBeneficiary.id!,
            campaignId: campaignRef.id, campaignName: ramadanCampaign.name,
            purpose: 'Medical', category: 'Surgical Procedure', donationType: 'Zakat',
            helpRequested: 60000, helpGiven: 60000, status: 'Closed', isLoan: true,
            caseDetails: 'Assistance for a major operation, as part of Ramadan drive.',
            verifiedStatus: 'Verified', verifiers: [verifier],
            donations: [{ donationId: medicalDonationRef.id, amount: 60000, allocatedAt: Timestamp.now(), allocatedByUserId: verifierAdmin.id, allocatedByUserName: verifierAdmin.name }],
            dateCreated: Timestamp.now(), adminAddedBy: { id: verifierAdmin.id, name: verifierAdmin.name },
            createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
        });
        leadResults.push({ name: `Medical Lead for ${medicalBeneficiary.name}`, status: 'Created' });

        batch.update(medicalDonationRef, { allocations: [{ leadId: medicalLeadRef.id, amount: 60000, allocatedAt: Timestamp.now() }] });
    }

    // 10 Family Ration Leads
    for (let i = 1; i < ramadanCampaignUsers.length; i++) {
        const familyBeneficiary = await getUserByPhone(ramadanCampaignUsers[i].phone);
        if (familyBeneficiary) {
            const familyLeadRef = doc(collection(db, 'leads'));
            const familyDonationRef = doc(collection(db, 'donations'));
            const randomDonor = allDonors[Math.floor(Math.random() * allDonors.length)];

            batch.set(familyDonationRef, {
                id: familyDonationRef.id,
                donorId: randomDonor.id!, donorName: randomDonor.name, amount: 4000,
                type: 'Zakat', purpose: 'Relief Fund', status: 'Allocated', isAnonymous: false,
                createdAt: Timestamp.now(), verifiedAt: Timestamp.now()
            });
            donationResults.push({ name: `Donation for ${familyBeneficiary.name}`, status: 'Created' });
            
            batch.set(familyLeadRef, {
                id: familyLeadRef.id, name: familyBeneficiary.name, beneficiaryId: familyBeneficiary.id!,
                campaignId: campaignRef.id, campaignName: ramadanCampaign.name,
                purpose: 'Relief Fund', category: 'Ration Kit', donationType: 'Zakat',
                helpRequested: 4000, helpGiven: 4000, status: 'Closed', isLoan: false,
                caseDetails: 'Ramadan ration kit for a family in need.',
                verifiedStatus: 'Verified', verifiers: [verifier],
                donations: [{ donationId: familyDonationRef.id, amount: 4000, allocatedAt: Timestamp.now(), allocatedByUserId: verifierAdmin.id, allocatedByUserName: verifierAdmin.name }],
                dateCreated: Timestamp.now(), adminAddedBy: { id: verifierAdmin.id, name: verifierAdmin.name },
                createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
            });
            leadResults.push({ name: `Ration Lead for ${familyBeneficiary.name}`, status: 'Created' });

            batch.update(familyDonationRef, { allocations: [{ leadId: familyLeadRef.id, amount: 4000, allocatedAt: Timestamp.now() }] });
        }
    }

    await batch.commit();
    return { campaignResults, leadResults, donationResults };
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
            campaignResults: [],
            orgStatus: 'Failed',
            quotesStatus: 'Failed',
            error: errorMsg,
        }
    }
    try {
        console.log("Seeding core admin users...");
        const userResults = await seedUsers(adminUsersToSeed);
        
        console.log("Seeding Ramadan campaign users...");
        const campaignUserResults = await seedUsers(ramadanCampaignUsers);
        
        const orgStatus = await seedOrganization();
        const quotesStatus = await seedInitialQuotes();
        const { donationResults, leadResults } = await seedDonationsAndLeads();
        const { campaignResults, leadResults: campaignLeadResults, donationResults: campaignDonationResults } = await seedCampaignsAndLinkedLeads();
        
        console.log('Database seeding process completed.');
        return { 
            userResults: [...userResults, ...campaignUserResults], 
            orgStatus, 
            quotesStatus, 
            leadResults: [...leadResults, ...campaignLeadResults], 
            donationResults: [...donationResults, ...campaignDonationResults],
            campaignResults,
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred during seeding.';
        console.error('Error seeding database:', errorMsg);
        return {
            userResults: [],
            donationResults: [],
            leadResults: [],
            campaignResults: [],
            orgStatus: 'Failed',
            quotesStatus: 'Failed',
            error: errorMsg,
        };
    }
};
