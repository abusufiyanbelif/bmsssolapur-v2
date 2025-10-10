
/**
 * @fileOverview A service to seed the database with initial data.
 */

import { createUser, User, UserRole, getUserByEmail, getUserByPhone, getAllUsers, updateUser, getUser, getUserByUserId, generateNextUserKey } from './user-service';
import { createOrganization, Organization, getCurrentOrganization, OrganizationFooter, updateOrganizationFooter } from './organization-service';
import { seedInitialQuotes as seedQuotesService, eraseAllQuotes } from './quotes-service';
import { db } from './firebase';
import { collection, getDocs, query, where, Timestamp, setDoc, doc, writeBatch, orderBy, getCountFromServer, limit, updateDoc, serverTimestamp, getDoc, deleteDoc, arrayUnion, FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, getAdminAuth } from './firebase-admin';
import type { Lead, Verifier, LeadDonationAllocation, Donation, Campaign, FundTransfer, LeadAction, AppSettings } from './types';
import { createLead, getLead, updateLead } from './lead-service';
import { createCampaign, getCampaign } from './campaign-service';
import { createDonation } from './donation-service';
import { updateAppSettings, getAppSettings } from './app-settings-service';

const USERS_COLLECTION = 'users';

// The admin and anonymous users are now hardcoded/auto-created, so they are removed from this initial seed.
const initialUsersToSeed: Omit<User, 'id' | 'createdAt' | 'userKey'>[] = [];


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

const defaultFooterContent: OrganizationFooter = {
    organizationInfo: {
        titleLine1: 'Baitul Mal',
        titleLine2: 'Samajik Sanstha',
        titleLine3: '(Solapur)',
        description: 'Baitul Mal Samajik Sanstha (Solapur) provides life-saving and life-enriching humanitarian aid to underserved populations in the Solapur region, regardless of faith or nationality.',
        registrationInfo: 'Reg No: (Solapur)/0000373/2025',
        taxInfo: 'Registered under the Societies Registration Act, 1860. All donations are tax-deductible under section 80G.',
    },
    contactUs: {
        title: 'Contact Us',
        address: '123 Muslim Peth, \n(Solapur), Maharashtra 413001 \nIndia',
        email: 'info@baitulmalsolapur.org',
    },
    keyContacts: {
        title: 'Key Contacts',
        contacts: [
            { name: 'Maaz Shaikh', phone: '9372145889' },
            { name: 'Abu Rehan Bedrekar', phone: '7276224160' },
            { name: 'Moosa Shaikh', phone: '8421708907' },
        ],
    },
    connectWithUs: {
        title: 'Connect With Us',
        socialLinks: [
            { platform: 'Facebook', url: '#' },
            { platform: 'Instagram', url: '#' },
            { platform: 'Twitter', url: '#' },
        ],
    },
    ourCommitment: {
        title: 'Our Commitment',
        text: 'We are dedicated to complete transparency and accountability in all our endeavors. Our work is guided by core principles that ensure your contributions directly and meaningfully impact those in need.',
        linkText: 'Read Our Principles →',
        linkUrl: '/organization#principles',
    },
    copyright: {
        text: `© ${new Date().getFullYear()} Baitul Mal Samajik Sanstha (Solapur). All Rights Reserved.`,
    },
};

const organizationToSeed: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> = {
    name: "BAITULMAL SAMAJIK SANSTHA SOLAPUR",
    logoUrl: "https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect.firebasestorage.app/o/organization%2Fassets%2Flogo%2F784d87d9-444f-4a5d-aef1-b8e812b17961.jpeg?alt=media&token=003b78da-c7d3-4a15-91b7-e31fa6d80247",
    city: "Solapur",
    address: "123 Muslim Peth, Solapur, Maharashtra 413001",
    registrationNumber: "Solapur/0000373/2025",
    panNumber: "AAPAB1213J",
    contactEmail: "contact@baitulmalsolapur.org",
    contactPhone: "919372145889",
    website: "https://baitulmalsolapur.org",
    bankAccountName: "BAITULMAL SAMAJIK SANSTHA",
    bankAccountNumber: "012345678901",
    bankIfscCode: "BKID0000707",
    upiId: "maaz9145@okhdfcbank",
    qrCodeUrl: "https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect.firebasestorage.app/o/organization%2Fassets%2Fqr-codes%2F4c99fe34-4897-4766-a6d5-db77b7d2aba8.jpg?alt=media&token=70475f1e-4e48-4394-aea6-ca73b91faa2a",
    footer: defaultFooterContent,
    source: 'Seeded',
};


// --- HISTORICAL/GENERAL LEADS ---
const generalBeneficiaryUsers: Omit<User, 'id' | 'createdAt' | 'userKey'>[] = [
    { name: "Aisha Begum", userId: "aisha.begum", firstName: "Aisha", lastName: "Begum", fatherName: "Mohammed Ali", email: "aisha.b@example.com", phone: "9876543211", password: "password", roles: ["Beneficiary"], isActive: true, gender: 'Female', beneficiaryType: 'Widow', isWidow: true, source: 'Seeded' },
    { name: "Ibrahim Khan", userId: "ibrahim.khan", firstName: "Ibrahim", lastName: "Khan", fatherName: "Yusuf Khan", email: "ibrahim.k@example.com", phone: "9876543212", password: "password", roles: ["Beneficiary"], isActive: true, gender: 'Male', beneficiaryType: 'Adult', source: 'Seeded' },
    { name: "Fatima Syed", userId: "fatima.syed", firstName: "Fatima", lastName: "Syed", fatherName: "Ali Syed", email: "fatima.s@example.com", phone: "9876543213", password: "password", roles: ["Beneficiary"], isActive: true, gender: 'Female', beneficiaryType: 'Kid', source: 'Seeded' },
    { name: "Yusuf Ahmed", userId: "yusuf.ahmed", firstName: "Yusuf", lastName: "Ahmed", fatherName: "Ahmed Sr.", email: "yusuf.a@example.com", phone: "9876543214", password: "password", roles: ["Beneficiary"], isActive: true, gender: 'Male', beneficiaryType: 'Old Age', source: 'Seeded' },
    { name: "Zainab Family", userId: "zainab.family", firstName: "Zainab", lastName: "Family", fatherName: "Anwar Shaikh", email: "zainab.f@example.com", phone: "9876543215", password: "password", roles: ["Beneficiary"], isActive: true, gender: 'Female', beneficiaryType: 'Family', source: 'Seeded' },
];

const generalLeadsData = [
    { phone: "9876543211", amount: 15000, isFunded: true, purpose: 'Medical', category: 'Hospital Bill', donationType: 'Sadaqah', details: 'Assistance for emergency medical bill for a widow.' },
    { phone: "9876543212", amount: 20000, isFunded: true, purpose: 'Loan', category: 'Business Loan', donationType: 'Lillah', isLoan: true, details: 'Small loan to start a fruit cart business.' },
    { phone: "9876543213", amount: 8000, isFunded: true, purpose: 'Education', category: 'School Fees', donationType: 'Sadaqah', details: 'Support for annual school fees for a young student.' },
    { phone: "9876543214", amount: 3000, isFunded: true, purpose: 'Relief Fund', category: 'Medication', donationType: 'Lillah', details: 'Monthly medication support for an elderly individual.' },
    { phone: "9876543215", amount: 5000, isFunded: false, purpose: 'Relief Fund', category: 'Utility Bill Payment', donationType: 'Sadaqah', details: 'Help to pay pending electricity bills to avoid disconnection.' },
];


// RAMADAN 2025 CAMPAIGN DATA
const reliefBeneficiaries: Omit<User, 'id' | 'createdAt' | 'userKey'>[] = Array.from({ length: 7 }, (_, i) => ({
    name: `Relief Beneficiary ${i + 1}`,
    userId: `relief.beneficiary.${i + 1}`,
    firstName: `Relief${i+1}`,
    lastName: "Family",
    fatherName: `Father ${i+1}`,
    email: `relief${i+1}@example.com`,
    phone: `98765433${i.toString().padStart(2, '0')}`,
    password: "password",
    roles: ["Beneficiary"] as UserRole[],
    isActive: true,
    gender: 'Other' as 'Other',
    beneficiaryType: 'Family' as 'Family',
    source: 'Seeded'
}));

const ramadanCampaignUsers: Omit<User, 'id' | 'createdAt' | 'userKey'>[] = [
    { name: "Salim Operation", userId: "salim.operation", firstName: "Salim", lastName: "Operation", fatherName: "Anwar Operation", email: "salim.op@example.com", phone: "4444444401", password: "password", roles: ["Beneficiary"], isActive: true, gender: 'Male', beneficiaryType: 'Adult', source: 'Seeded' },
    { name: "Salim Baig", userId: "salim.baig", firstName: "Salim", lastName: "Baig", fatherName: "Anwar Baig", email: "salim.baig@example.com", phone: "4444444402", password: "password", roles: ["Beneficiary"], isActive: true, gender: 'Male', beneficiaryType: 'Adult', source: 'Seeded' },
    ...reliefBeneficiaries,
    ...Array.from({ length: 10 }, (_, i) => ({
        name: `Ration Family ${i + 1}`,
        userId: `ration.family.${i + 1}`,
        firstName: `RationFamily${i+1}`,
        lastName: "User",
        fatherName: "Father User",
        email: `ration${i+1}@example.com`,
        phone: `55555555${i.toString().padStart(2, '0')}`,
        password: "password",
        roles: ["Beneficiary"] as UserRole[],
        isActive: true,
        gender: 'Other' as 'Other',
        beneficiaryType: 'Family' as 'Family',
        source: 'Seeded'
    }))
];

const ramadan2025Campaign: Omit<Campaign, 'createdAt' | 'updatedAt'> = {
    id: "ramadan-2025-zakat-drive",
    name: "Ramadan 2025 Zakat Drive",
    description: "A campaign to collect Zakat during Ramadan 2025 to help with critical operations and provide ration kits to families in need.",
    goal: 200000,
    status: 'Completed',
    startDate: Timestamp.fromDate(new Date("2025-03-01")),
    endDate: Timestamp.fromDate(new Date("2025-03-30")),
    source: 'Seeded',
};

const floodReliefCampaign: Omit<Campaign, 'createdAt' | 'updatedAt'> = {
    id: "flood-relief-september-2025",
    name: "Flood Relief September 2025 Solapur by SIO",
    description: `Solapur Flood Relief Report - Day 3

- Pakani Village :

Today our team visited Pakani Village in North Solapur, where we conducted survey of homes affected by flood, we identified 15+ homes who lost almost everything in Flood. We also distributed Water Bottles and Biscuits.

- Tirhe Village :

In Tirhe Village we distributed 20 Ration Kits of 1500/- each, which includes (Daal, oil, Mat, Dettol, Soap, Water Bottles, Sugar, Tea, Cleaning Materials, etc.) to all affected people. We also identified 20+ people who lost everything in Flood.

- Hattur Village :

In Hattur Village we conducted survey of houses affected by Floods, and we also distributed Water Bottles and Biscuits to needy people in village.

We need 50+ Ration Kits (1500/- each) for coming days.

Donate Generously for the Flood affected people. 

💐 SIO and Jamaat-e-Islami Hind Solapur💐`,
    goal: 75000, // 50 kits * 1500 each
    collectedAmount: 7500,
    status: 'Completed',
    startDate: Timestamp.fromDate(new Date("2025-09-01")),
    endDate: Timestamp.fromDate(new Date("2025-09-15")),
    isHistoricalRecord: true,
    source: 'Seeded',
};


// WINTER CAMPAIGN DATA
const winterCampaignUsers: Omit<User, 'id' | 'createdAt' | 'userKey'>[] = [
    { name: "Winter Beneficiary A", userId: "winter.beneficiary.a", firstName: "Winter", lastName: "Beneficiary A", fatherName: "Father A", email: "winter.a@example.com", phone: "8888888801", password: "password", roles: ["Beneficiary"], isActive: true, gender: 'Other', beneficiaryType: 'Family', source: 'Seeded' },
    { name: "Winter Beneficiary B", userId: "winter.beneficiary.b", firstName: "Winter", lastName: "Beneficiary B", fatherName: "Father B", email: "winter.b@example.com", phone: "8888888802", password: "password", roles: ["Beneficiary"], isActive: true, gender: 'Other', beneficiaryType: 'Family', source: 'Seeded' },
];

const winterCampaign: Omit<Campaign, 'createdAt' | 'updatedAt'> = {
    id: "winter-relief-2024",
    name: "Winter Relief 2024",
    description: "A campaign to provide blankets and warm clothing to families during the cold winter months.",
    goal: 50000,
    status: 'Active',
    startDate: Timestamp.fromDate(new Date("2024-11-01")),
    endDate: Timestamp.fromDate(new Date("2024-12-31")),
    source: 'Seeded',
};

// RAMADAN 2026 CAMPAIGN DATA
const ramadan2026CampaignUsers: Omit<User, 'id' | 'createdAt' | 'userKey'>[] = [
    { name: "Future Ration Family 1", userId: "future.ration.1", firstName: "Future", lastName: "Family 1", fatherName: "Future Father 1", email: "future1@example.com", phone: "6666666601", password: "password", roles: ["Beneficiary"], isActive: true, gender: 'Other', beneficiaryType: 'Family', source: 'Seeded' },
    { name: "Future Ration Family 2", userId: "future.ration.2", firstName: "Future", lastName: "Family 2", fatherName: "Future Father 2", email: "future2@example.com", phone: "6666666602", password: "password", roles: ["Beneficiary"], isActive: true, gender: 'Other', beneficiaryType: 'Family', source: 'Seeded' },
];

const ramadan2026Campaign: Omit<Campaign, 'createdAt' | 'updatedAt'> = {
    id: "ramadan-2026-zakat-drive",
    name: "Ramadan 2026 Zakat Drive",
    description: "Our upcoming campaign to collect Zakat during Ramadan 2026 for ration kits.",
    goal: 200000,
    status: 'Upcoming',
    startDate: Timestamp.fromDate(new Date("2026-02-18")),
    endDate: Timestamp.fromDate(new Date("2026-03-20")),
    source: 'Seeded',
};


export type SeedItemResult = { name: string; status: 'Created' | 'Updated' | 'Skipped (already exists)' | 'Failed' };
export type SeedResult = {
    message: string;
    details?: string[];
};

const seedUsers = async (users: Omit<User, 'id' | 'createdAt' | 'userKey'>[]): Promise<string[]> => {
    const results: string[] = [];

    for (const userData of users) {
        let existingUser: User | null = null;
        
        // Use a consistent, safe way to check for existing users
        if (userData.phone) existingUser = await getUserByPhone(userData.phone);
        if (!existingUser && userData.email) existingUser = await getUserByEmail(userData.email);
        if (!existingUser && userData.userId) existingUser = await getUserByUserId(userData.userId);


        if (existingUser) {
            results.push(`User ${userData.name}: Skipped (already exists)`);
        } else {
            try {
                await createUser(userData);
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
    const existingOrg = await getCurrentOrganization();
    if (existingOrg) {
        // Use the server-side `updateDoc` which requires a plain object
        const adminDb = getAdminDb();
        await adminDb.collection('organizations').doc(existingOrg.id).update({ ...organizationToSeed, updatedAt: Timestamp.now() });
        return "Organization profile updated with seed data.";
    }
    await createOrganization(organizationToSeed);
    return "Organization profile created successfully.";
}


const seedGeneralLeads = async (adminUser: User): Promise<string[]> => {
    const leadResults: string[] = [];
    const adminDb = getAdminDb();
    
    await seedUsers(generalBeneficiaryUsers);

    const moosaShaikh = await getUserByPhone("8421708907");
    if (!moosaShaikh) throw new Error("Moosa Shaikh not found for general lead seeding.");
    
    const verifier: Verifier = {
        verifierId: moosaShaikh.id!,
        verifierName: moosaShaikh.name,
        verifiedAt: new Date(),
        notes: "Verified as part of historical data import."
    };

    const allDonors = (await getAllUsers()).filter(u => u.roles.includes('Donor') && u.name !== 'Anonymous Donor');
    if (allDonors.length === 0) throw new Error("No donor users found for general lead seeding.");
    
    for (const leadInfo of generalLeadsData) {
        const beneficiary = await getUserByPhone(leadInfo.phone);
        if (!beneficiary) continue;

        // Check if a similar lead already exists to prevent duplicates
        const existingLeadQuery = adminDb.collection('leads')
            .where('beneficiaryId', '==', beneficiary.id!)
            .where('purpose', '==', leadInfo.purpose)
            .where('category', '==', leadInfo.category)
            .limit(1);
        const existingLeadSnapshot = await existingLeadQuery.get();
        if (!existingLeadSnapshot.empty) {
            leadResults.push(`General Lead for ${beneficiary.name} (${leadInfo.purpose}): Skipped (already exists)`);
            continue;
        }

        const caseAction: LeadAction = leadInfo.isFunded ? 'Closed' : 'Publish';

        const newLeadData: Partial<Lead> = {
            name: beneficiary.name, beneficiaryId: beneficiary.id!,
            purpose: leadInfo.purpose as any, category: leadInfo.category, donationType: leadInfo.donationType as any,
            helpRequested: leadInfo.amount, helpGiven: leadInfo.isFunded ? leadInfo.amount : 0,
            caseAction: caseAction,
            caseStatus: caseAction === 'Closed' ? 'Closed' : 'Open',
            isLoan: leadInfo.isLoan || false,
            caseDetails: leadInfo.details,
            caseVerification: 'Verified', verifiers: [verifier],
            dateCreated: new Date(), adminAddedBy: { id: adminUser.id!, name: adminUser.name },
            source: 'Seeded',
            isHistoricalRecord: true,
        };

        const createdLead = await createLead(newLeadData, adminUser);

        if (leadInfo.isFunded) {
             const randomDonor = allDonors[Math.floor(Math.random() * allDonors.length)];
             const randomDonationDate = getRandomDate(new Date('2021-01-01'), new Date('2025-12-31'));
             const verifiedDate = new Date(randomDonationDate.getTime() + 86400000); // 1 day later
            
             const newDonation = await createDonation({
                donorId: randomDonor.id!, donorName: randomDonor.name, amount: leadInfo.amount,
                type: leadInfo.donationType as any, purpose: leadInfo.purpose as any, status: 'Allocated', isAnonymous: false,
                donationDate: randomDonationDate, 
                verifiedAt: verifiedDate,
                leadId: createdLead.id!, source: 'Seeded'
            }, adminUser.id!, adminUser.name, adminUser.email);
            
            const newTransfer: FundTransfer = {
                transferredByUserId: adminUser.id!,
                transferredByUserName: adminUser.name,
                amount: leadInfo.amount,
                transferredAt: new Date(),
                proofUrl: 'https://placehold.co/600x400.png?text=seeded-transfer-proof',
                notes: 'Dummy transfer for seeded closed lead.',
                transactionId: `SEED_TXN_${createdLead.id}`
            };
            
            await adminDb.collection('leads').doc(createdLead.id!).update({
                donations: FieldValue.arrayUnion({ donationId: newDonation.id!, amount: leadInfo.amount, allocatedAt: Timestamp.now(), allocatedByUserId: adminUser.id!, allocatedByUserName: adminUser.name }),
                fundTransfers: FieldValue.arrayUnion(newTransfer)
            });
        }
        
        leadResults.push(`General Lead for ${beneficiary.name} created.`);
    }
    return leadResults;
};

const seedCampaignAndData = async (campaignData: Omit<Campaign, 'createdAt' | 'updatedAt'>, userData: Omit<User, 'id' | 'createdAt' | 'userKey'>[], leadsData: any[]): Promise<string[]> => {
    let results: string[] = [];
    const adminUser = await getUserByUserId("admin");
    if (!adminUser) throw new Error("Required admin user for seeding not found.");
    const adminDb = getAdminDb();

    await seedUsers(userData);

    const campaignId = campaignData.id!;
    const campaignRef = adminDb.collection('campaigns').doc(campaignId);
    
    // Create the campaign using the predefined ID with set and merge
    await setDoc(campaignRef, { ...campaignData }, { merge: true });
    results.push(`Campaign "${campaignData.name}" created or updated.`);
    const campaign = await getCampaign(campaignId);
    if(!campaign) throw new Error(`Failed to retrieve campaign ${campaignId} after seeding.`);
    
    const verifierToUse: Verifier = {
        verifierId: adminUser.id,
        verifierName: adminUser.name,
        verifiedAt: new Date(),
        notes: "Verified as part of historical data import."
    };

    const allDonors = (await getAllUsers()).filter(u => u.roles.includes('Donor') && u.name !== 'Anonymous Donor');
    if (allDonors.length === 0) throw new Error("No donor users found for campaign seeding.");

    for (const leadInfo of leadsData) {
        const beneficiary = await getUserByPhone(leadInfo.phone);
        if (!beneficiary) continue;

        // Check for duplicate lead within the campaign
        const existingLeadQuery = adminDb.collection('leads')
            .where('beneficiaryId', '==', beneficiary.id!)
            .where('campaignId', '==', campaign.id)
            .where('purpose', '==', leadInfo.purpose)
            .limit(1);
        if (!(await existingLeadQuery.get()).empty) {
            results.push(`Lead for ${beneficiary.name} in ${campaignData.name}: Skipped (already exists)`);
            continue;
        }

        const caseAction: LeadAction = campaignData.status === 'Completed' ? 'Closed'
                                      : campaignData.status === 'Active' ? 'Publish'
                                      : 'Pending';
                                      
        const newLeadData: Partial<Lead> = {
            name: beneficiary.name, beneficiaryId: beneficiary.id,
            campaignId: campaign.id, campaignName: campaign.name,
            purpose: leadInfo.purpose, category: leadInfo.category, donationType: leadInfo.donationType,
            helpRequested: leadInfo.amount, helpGiven: leadInfo.isFunded ? leadInfo.amount : 0,
            caseAction: caseAction,
            caseStatus: caseAction === 'Closed' ? 'Closed' : 'Open',
            isLoan: leadInfo.isLoan || false,
            caseDetails: leadInfo.details, caseVerification: 'Verified', verifiers: [verifierToUse],
            dateCreated: new Date(), adminAddedBy: { id: adminUser.id, name: adminUser.name },
            source: 'Seeded',
            isHistoricalRecord: true,
        };

        const createdLead = await createLead(newLeadData, adminUser);
        
        if (leadInfo.isFunded) {
            const randomDonor = allDonors[Math.floor(Math.random() * allDonors.length)];
            const newDonation = await createDonation({
                donorId: randomDonor.id!, donorName: randomDonor.name, amount: leadInfo.amount,
                type: leadInfo.donationType, purpose: leadInfo.purpose, status: 'Allocated', isAnonymous: false,
                donationDate: new Date(), verifiedAt: new Date(),
                campaignId: campaign.id, leadId: createdLead.id, source: 'Seeded'
            }, adminUser.id!, adminUser.name, adminUser.email);
            
            const newTransfer: FundTransfer = {
                transferredByUserId: adminUser.id!, transferredByUserName: adminUser.name,
                amount: leadInfo.amount, transferredAt: new Date(),
                proofUrl: 'https://placehold.co/600x400.png?text=seeded-transfer-proof',
                notes: 'Dummy transfer for seeded closed lead.', transactionId: `SEED_TXN_${createdLead.id}`
            };
            
            await adminDb.collection('leads').doc(createdLead.id!).update({
                donations: FieldValue.arrayUnion({ donationId: newDonation.id!, amount: leadInfo.amount, allocatedAt: Timestamp.now(), allocatedByUserId: adminUser.id!, allocatedByUserName: adminUser.name }),
                fundTransfers: FieldValue.arrayUnion(newTransfer)
            });
        }
        
        results.push(`Lead for ${beneficiary.name} in ${campaignData.name} created.`);
    }

    return results;
}

const seedRamadan2025ReliefData = async (adminUser: User): Promise<string[]> => {
    let results: string[] = [];
    await seedUsers(reliefBeneficiaries);
    const adminDb = getAdminDb();
    
    const donorsToCreate: Omit<User, 'id'|'createdAt'|'userKey'>[] = Array.from({length: 20}, (_, i) => ({
        name: `Zakat Donor ${i+1}`, userId: `zakat.donor.${i+1}`, firstName: 'Zakat', lastName: `Donor ${i+1}`,
        email: `donor${i+1}@example.com`, phone: `77777777${i.toString().padStart(2, '0')}`, password: 'password',
        roles: ['Donor'], isActive: true, gender: 'Other', source: 'Seeded'
    }));
    await seedUsers(donorsToCreate);
    const donors = await Promise.all(donorsToCreate.map(d => getUserByPhone(d.phone!)));

    const campaignId = "ramadan-2025-zakat-drive";
    const campaign = await getCampaign(campaignId);
    if (!campaign) throw new Error("Ramadan 2025 campaign not found.");

    const leadData = [
        { phone: '9876543300', amount: 10000, category: 'Shelter Assistance' },
        { phone: '9876543301', amount: 10000, category: 'Shelter Assistance' },
        { phone: '9876543302', amount: 6000, category: 'Ration Kit' },
        { phone: '9876543303', amount: 6000, category: 'Ration Kit' },
        { phone: '9876543304', amount: 6000, category: 'Ration Kit' },
        { phone: '9876543305', amount: 6000, category: 'Other' },
        { phone: '9876543306', amount: 6000, category: 'Other' },
    ];

    for (const data of leadData) {
        const beneficiary = await getUserByPhone(data.phone);
        if (!beneficiary) continue;

        // Check for duplicate lead
        const existingLeadQuery = adminDb.collection('leads').where('beneficiaryId', '==', beneficiary.id!).where('campaignId', '==', campaign.id).limit(1);
        if (!(await existingLeadQuery.get()).empty) {
            results.push(`Seeded Relief Lead for ${beneficiary.name}: Skipped (already exists)`);
            continue;
        }

        const newLeadData: Partial<Lead> = {
            name: beneficiary.name, beneficiaryId: beneficiary.id,
            campaignId: campaign.id, campaignName: campaign.name,
            purpose: 'Relief Fund', category: data.category,
            helpRequested: data.amount, helpGiven: data.amount, 
            caseAction: 'Closed', caseStatus: 'Closed',
            caseVerification: 'Verified', verifiers: [{ verifierId: adminUser.id!, verifierName: adminUser.name, verifiedAt: new Date(), notes: "Seeded" }],
            dateCreated: new Date(), adminAddedBy: { id: adminUser.id!, name: adminUser.name }, source: 'Seeded', isHistoricalRecord: true
        };
        const createdLead = await createLead(newLeadData, adminUser);
        
        let allocated = 0;
        for (const donor of donors) {
            if (!donor || allocated >= data.amount) break;
            const donationAmount = 2500; // Each donor gives 2500
            const amountToAllocate = Math.min(donationAmount, data.amount - allocated);
            
            if (amountToAllocate > 0) {
                 const newDonation = await createDonation({
                    donorId: donor.id!, donorName: donor.name, amount: amountToAllocate,
                    type: 'Zakat', purpose: 'Relief Fund', status: 'Allocated',
                    donationDate: new Date(), campaignId: campaign.id, leadId: createdLead.id, source: 'Seeded'
                }, adminUser.id!, adminUser.name, adminUser.email);

                const newTransfer: FundTransfer = {
                    transferredByUserId: adminUser.id!, transferredByUserName: adminUser.name,
                    amount: amountToAllocate, transferredAt: new Date(),
                    proofUrl: 'https://placehold.co/600x400.png?text=seeded-transfer-proof',
                    notes: 'Dummy transfer for seeded relief lead.', transactionId: `SEED_TXN_${createdLead.id}_${donor.id}`
                };
            
                await adminDb.collection('leads').doc(createdLead.id!).update({
                    donations: FieldValue.arrayUnion({ donationId: newDonation.id!, amount: amountToAllocate, allocatedAt: Timestamp.now(), allocatedByUserId: adminUser.id!, allocatedByUserName: adminUser.name }),
                    fundTransfers: FieldValue.arrayUnion(newTransfer)
                });
                allocated += amountToAllocate;
            }
        }
        results.push(`Seeded Relief Lead for ${beneficiary.name} with donations.`);
    }

    return results;
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper to delete all documents in a collection
async function deleteCollection(collectionPath: string): Promise<number> {
    const adminDb = getAdminDb();
    const collectionRef = adminDb.collection(collectionPath);
    const q = collectionRef.limit(100);
    
    let deletedCount = 0;
    let snapshot = await q.get();

    while (snapshot.size > 0) {
        const batch = adminDb.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        deletedCount += snapshot.size;
        snapshot = await q.get();
    }
    return deletedCount;
}


// --- EXPORTED SEEDING FUNCTIONS ---

export const seedInitialUsersAndQuotes = async (): Promise<SeedResult> => {
    const quotesStatus = await seedQuotesService();
    const orgStatus = await seedOrganization(); // Organization is critical, seed it here.
    return {
        message: 'Initial Seeding Complete',
        details: [quotesStatus, orgStatus, "The 'admin' user is automatically created on startup and does not need to be seeded."]
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
    // This will create or overwrite the settings with the default structure.
    await updateAppSettings(defaultSettings as any);
    return {
        message: "Application Settings Seeded",
        details: ["Default settings for login, features, lead configuration, and dashboards have been applied."]
    };
};


export const seedPaymentGateways = async (): Promise<SeedResult> => {
    const settings = await getAppSettings();
    const updates: Partial<AppSettings> = {
      paymentGateway: {
        ...settings.paymentGateway,
        razorpay: {
          enabled: true,
          mode: 'test',
          test: {
            keyId: 'rzp_test_RKeVb4MhE2c8Gj',
            keySecret: 'Rv71cokSCaJg4f3fQ6pY8l2g',
          },
          live: {
            keyId: '',
            keySecret: '',
          },
        },
      },
      features: { 
        ...settings.features,
        onlinePaymentsEnabled: true, 
      }
    };
    await updateAppSettings(updates);
    return {
        message: 'Payment Gateway Seeding Complete',
        details: ["Razorpay test credentials have been saved and the gateway is enabled."]
    };
};

export const seedSampleData = async (): Promise<SeedResult> => {
    let details: string[] = [];

    // The logic inside now relies on this user existing.
    const adminUser = await getUserByUserId("admin");
    if (!adminUser) throw new Error("Required 'admin' user for seeding not found. Please run initial seed first.");

    // Seed General Leads
    details.push(...await seedGeneralLeads(adminUser));

    // Seed Flood Relief Campaign
    details.push(...await seedCampaignAndData(floodReliefCampaign, [], []));

    // Seed Ramadan 2025 Campaign and its main leads
    const ramadanLeads = [
        // This is the 1 Lakh loan for Salim Baig
        { phone: "4444444402", amount: 100000, isFunded: true, isLoan: true, purpose: 'Loan', category: 'Business Loan', donationType: 'Any', details: 'Business expansion loan for Salim Baig.' },
        // This is the medical operation for Salim Operation
        { phone: "4444444401", amount: 60000, isFunded: true, isLoan: false, purpose: 'Medical', category: 'Surgical Procedure', donationType: 'Zakat', details: 'Assistance for a major operation, as part of Ramadan drive.' },
        // These are the 10 ration kit leads
        ...ramadanCampaignUsers.slice(9, 19).map(u => ({ phone: u.phone, amount: 4000, isFunded: true, isLoan: false, purpose: 'Relief Fund', category: 'Ration Kit', donationType: 'Zakat', details: 'Ramadan ration kit for a family in need.' }))
    ];
    details.push(...await seedCampaignAndData(ramadan2025Campaign, ramadanCampaignUsers, ramadanLeads));
    
    // Seed the 50k relief data (7 beneficiaries, 20 donors)
    details.push(...await seedRamadan2025ReliefData(adminUser));

    // Seed Winter Campaign
    const winterLeads = [
        { phone: winterCampaignUsers[0].phone, amount: 2500, isFunded: false, purpose: 'Relief Fund', category: 'Winter Kit', donationType: 'Sadaqah', details: 'Help for winter clothing and blankets for Winter Beneficiary A.' },
        { phone: winterCampaignUsers[1].phone, amount: 3500, isFunded: false, purpose: 'Relief Fund', category: 'Winter Kit', donationType: 'Sadaqah', details: 'Help for winter clothing and blankets for Winter Beneficiary B.' }
    ];
    details.push(...await seedCampaignAndData(winterCampaign, winterCampaignUsers, winterLeads));

    // Seed Ramadan 2026 Campaign
    const ramadan2026Leads = [
        { phone: ramadan2026CampaignUsers[0].phone, amount: 5000, isFunded: false, purpose: 'Relief Fund', category: 'Ration Kit', donationType: 'Zakat', details: 'Future ration kit for family 1.' },
        { phone: ramadan2026CampaignUsers[1].phone, amount: 5000, isFunded: false, purpose: 'Relief Fund', category: 'Ration Kit', donationType: 'Zakat', details: 'Future ration kit for family 2.' }
    ];
    details.push(...await seedCampaignAndData(ramadan2026Campaign, ramadan2026CampaignUsers, ramadan2026Leads));

    return {
        message: 'Sample Data Seeding Complete',
        details: details
    };
}


// --- ERASE FUNCTIONS ---

export const eraseInitialUsersAndQuotes = async (): Promise<SeedResult> => {
    const quotesDeleted = await eraseAllQuotes();
    
    return {
        message: 'Initial Data Erased',
        details: [`Deleted ${quotesDeleted} quotes. The 'admin' user is hardcoded and was not affected.`]
    };
};

export const eraseCoreTeam = async (): Promise<SeedResult> => {
    const adminDb = getAdminDb();
    const phonesToDelete = coreTeamUsersToSeed.map(u => u.phone);
    const usersToDeleteQuery = adminDb.collection(USERS_COLLECTION).where("phone", "in", phonesToDelete);
    const snapshot = await usersToDeleteQuery.get();

    if(snapshot.empty) {
        return { message: "No core team members found to erase.", details: [] };
    }

    const batch = adminDb.batch();
    let deletedCount = 0;
    const deletedNames: string[] = [];

    snapshot.docs.forEach(doc => {
        // Critical safeguard for core admins
        if (doc.data().userId !== 'abusufiyan.belif' && doc.data().userId !== 'moosa.shaikh') {
            batch.delete(doc.ref);
            deletedCount++;
            deletedNames.push(`${doc.data().name} (${doc.data().phone}) deleted.`);
        }
    });

    await batch.commit();

    return {
        message: `Erased ${deletedCount} core team members.`,
        details: deletedNames
    };
};

export const eraseOrganizationProfile = async (): Promise<SeedResult> => {
    const adminDb = getAdminDb();
    const org = await getCurrentOrganization();
    if (!org) {
        return { message: "No organization profile found to erase.", details: [] };
    }
    await adminDb.collection('organizations').doc(org.id).delete();
    // Also delete public record
    await adminDb.collection('publicData').doc('organization').delete();
    return {
        message: 'Organization Profile Erased',
        details: [`Deleted profile for "${org.name}".`]
    };
};

export const erasePaymentGateways = async (): Promise<SeedResult> => {
    const settings = await getAppSettings();
    const updates: Partial<AppSettings> = {
      paymentGateway: {
        ...settings.paymentGateway,
        razorpay: {
          enabled: false,
          mode: 'test',
          test: { keyId: '', keySecret: '' },
          live: { keyId: '', keySecret: '' }
        },
      },
      features: { 
        ...settings.features,
        onlinePaymentsEnabled: false, 
      }
    };
    await updateAppSettings(updates);
    return {
        message: 'Payment Gateway Settings Erased',
        details: ["Razorpay test credentials have been cleared and the gateway is disabled."]
    };
};

export const eraseSampleData = async (): Promise<SeedResult> => {
    const details: string[] = [];
    const adminDb = getAdminDb();

    // This function will delete ALL documents from these collections,
    // which is the desired behavior to clear out duplicates.
    const deletedLeads = await deleteCollection('leads');
    details.push(`Deleted ${deletedLeads} leads.`);
    await deleteCollection('publicLeads');


    const deletedDonations = await deleteCollection('donations');
    details.push(`Deleted ${deletedDonations} donations.`);

    const deletedCampaigns = await deleteCollection('campaigns');
    details.push(`Deleted ${deletedCampaigns} campaigns.`);
    await deleteCollection('publicCampaigns');
    
    // Find and delete all users with source: 'Seeded', except for the main admin accounts
    const seededUsersQuery = adminDb.collection(USERS_COLLECTION).where("source", "==", "Seeded");
    const usersSnapshot = await seededUsersQuery.get();
    
    const batch = adminDb.batch();
    let deletedUserCount = 0;
    usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        // Safeguard: Do not delete the main admin users or system users
        if (userData.userId !== 'admin' && userData.userId !== 'abusufiyan.belif' && userData.userId !== 'anonymous_donor') {
           batch.delete(doc.ref);
           deletedUserCount++;
        }
    });
    
    if (deletedUserCount > 0) {
        await batch.commit();
        details.push(`Deleted ${deletedUserCount} seeded users.`);
    }

    return {
        message: 'Sample Data Erased',
        details: details,
    };
};

export const eraseAppSettings = async (): Promise<SeedResult> => {
    const adminDb = getAdminDb();
    const settingsDocRef = adminDb.collection('settings').doc('main');
    await settingsDocRef.delete();
    return {
        message: "Application Settings Erased",
        details: ["The main settings document has been deleted. Default settings will be applied on next load."]
    };
};

export const eraseFirebaseAuthUsers = async (): Promise<SeedResult> => {
    const allUsers = await getAllUsers();
    let deletedCount = 0;
    let errorCount = 0;
    const details: string[] = [];
    const adminAuth = getAdminAuth();

    const authPromises = allUsers.map(async (user) => {
        if (user.id) {
            try {
                await adminAuth.deleteUser(user.id);
                deletedCount++;
            } catch (error: any) {
                if (error.code !== 'auth/user-not-found') {
                    errorCount++;
                    details.push(`Failed to delete ${user.name} (Auth UID: ${user.id}): ${error.code}`);
                }
            }
        }
    });

    await Promise.all(authPromises);
    
    return {
        message: "Firebase Auth Users Erased",
        details: [
            `Successfully deleted ${deletedCount} users from Firebase Authentication.`,
            `Encountered ${errorCount} errors.`,
            ...details.slice(0, 10)
        ]
    };
};

export const syncUsersToFirebaseAuth = async (): Promise<SeedResult> => {
    const allUsers = await getAllUsers();
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const details: string[] = [];
    const adminAuth = getAdminAuth();

    for (const user of allUsers) {
        if (user.phone && user.id) {
            try {
                // Check if user already exists in Auth by phone number
                await adminAuth.getUserByPhoneNumber(`+91${user.phone}`);
                skippedCount++;
            } catch (error: any) {
                if (error.code === 'auth/user-not-found') {
                    // User does not exist, so we can create them
                    try {
                        await adminAuth.createUser({
                            uid: user.id, // Use Firestore doc ID as Auth UID
                            phoneNumber: `+91${user.phone}`,
                            displayName: user.name,
                            password: user.password,
                        });
                        createdCount++;
                    } catch (creationError: any) {
                        errorCount++;
                        details.push(`User ${user.name}: Failed to create in Auth (${creationError.code})`);
                    }
                } else {
                    // Some other error occurred while checking
                    errorCount++;
                    details.push(`User ${user.name}: Error checking Auth status (${error.code})`);
                }
            }
        } else {
            details.push(`User ${user.name}: Skipped (no phone number or ID)`);
        }
    }

    return {
        message: `Firebase Auth Sync Complete`,
        details: [
            `Created: ${createdCount}`,
            `Skipped: ${skippedCount}`,
            `Errors: ${errorCount}`,
            ...details.slice(0, 10) // Show first 10 detailed results
        ]
    };
};
