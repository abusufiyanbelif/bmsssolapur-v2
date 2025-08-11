
/**
 * @fileOverview A service to seed the database with initial data.
 */

import { createUser, User, UserRole, getUserByEmail, getUserByPhone, getAllUsers, updateUser, getUser, getUserByUserId } from './user-service';
import { createOrganization, Organization, getCurrentOrganization } from './organization-service';
import { seedInitialQuotes } from './quotes-service';
import { db, isConfigValid } from './firebase';
import { collection, getDocs, query, where, Timestamp, setDoc, doc, writeBatch, orderBy, getCountFromServer, limit } from 'firebase/firestore';
import type { Lead, Verifier, LeadDonationAllocation, Donation, Campaign } from './types';
import { createLead, getLead } from './lead-service';
import { createCampaign, getCampaign } from './campaign-service';
import { createDonation } from './donation-service';

const USERS_COLLECTION = 'users';

const adminUsersToSeed: Omit<User, 'id' | 'createdAt'>[] = [
    // Super Admin
    { userKey: "USR01", name: "admin", userId: "admin.user", firstName: "Admin", lastName: "User", email: "admin@example.com", phone: "9999999999", password: "admin", roles: ["Super Admin"], privileges: ["all"], groups: ["Founder"], isActive: true, gender: 'Other', source: 'Seeded' },
    { userKey: "USR02", name: "Abusufiyan Belif", userId: "abusufiyan.belif", firstName: "Abusufiyan", middleName: "", lastName: "Belif", email: "abusufiyan.belif@gmail.com", phone: "7887646583", password: "admin", roles: ["Super Admin", "Admin", "Donor", "Beneficiary"], privileges: ["all"], groups: ["Member of Organization", "Lead Approver"], isActive: true, gender: 'Male', address: { addressLine1: '123 Admin Lane', city: 'Solapur', state: 'Maharashtra', country: 'India', pincode: '413001' }, panNumber: 'ABCDE1234F', aadhaarNumber: '123456789012', source: 'Seeded' },
    
    // Admins (Founders and Members)
    { userKey: "USR03", name: "Moosa Shaikh", userId: "moosa.shaikh", firstName: "Moosa", middleName: "", lastName: "Shaikh", email: "moosa.shaikh@example.com", phone: "8421708907", password: "admin", roles: ["Admin", "Donor"], privileges: ["canManageLeads"], groups: ["Founder", "Lead Approver"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { userKey: "USR04", name: "Maaz Shaikh", userId: "maaz.shaikh", firstName: "Maaz", middleName: "", lastName: "Shaikh", email: "maaz.shaikh@example.com", phone: "9372145889", password: "admin", roles: ["Admin", "Finance Admin", "Donor"], privileges: ["canManageDonations", "canViewFinancials"], groups: ["Finance", "Lead Approver"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { userKey: "USR05", name: "AbuRehan Bedrekar", userId: "aburehan.bedrekar", firstName: "AbuRehan", middleName: "", lastName: "Bedrekar", email: "aburehan.bedrekar@example.com", phone: "7276224160", password: "admin", roles: ["Admin", "Donor"], privileges: ["canManageLeads"], groups: ["Co-Founder", "Lead Approver"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { userKey: "USR06", name: "NayyarAhmed Karajgi", userId: "nayyarahmed.karajgi", firstName: "NayyarAhmed", middleName: "", lastName: "Karajgi", email: "nayyar.karajgi@example.com", phone: "9028976036", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { userKey: "USR07", name: "Arif Baig", userId: "arif.baig", firstName: "Arif", middleName: "", lastName: "Baig", email: "arif.baig@example.com", phone: "9225747045", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { userKey: "USR08", name: "Mazhar Shaikh", userId: "mazhar.shaikh", firstName: "Mazhar", middleName: "", lastName: "Shaikh", email: "mazhar.shaikh@example.com", phone: "8087669914", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { userKey: "USR09", name: "Mujahid Chabukswar", userId: "mujahid.chabukswar", firstName: "Mujahid", middleName: "", lastName: "Chabukswar", email: "mujahid.chabukswar@example.com", phone: "8087420544", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { userKey: "USR10", name: "Muddasir Shaikh", userId: "muddasir.shaikh", firstName: "Muddasir", middleName: "", lastName: "Shaikh", email: "muddasir@example.com", phone: "7385557820", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    
    // Generic Donors & Beneficiaries
    { userKey: "USR11", name: "Anonymous Donor", userId: "anonymous.donor", firstName: "Anonymous", middleName: "", lastName: "Donor", email: "anonymous@example.com", phone: "0000000000", password: "admin", roles: ["Donor"], isAnonymousAsDonor: true, privileges: [], groups: [], isActive: true, gender: 'Other', source: 'Seeded' },
    { userKey: "USR12", name: "Anonymous Beneficiary", userId: "anonymous.beneficiary", firstName: "Anonymous", lastName: "Beneficiary", email: "anonymous.beneficiary@example.com", phone: "0000000001", password: "admin", roles: ["Beneficiary"], isAnonymousAsBeneficiary: true, isActive: true, gender: 'Other', source: 'Seeded' },
    { userKey: "USR13", name: "AnonymousBoth User", userId: "anonymous.user.both", firstName: "AnonymousBoth", lastName: "User", email: "anonymous.both@example.com", phone: "3333333333", password: "admin", roles: ["Beneficiary", "Donor"], isAnonymousAsBeneficiary: true, isAnonymousAsDonor: true, isActive: true, gender: 'Other', source: 'Seeded' },
    
    // Hardcoded Donor user
    { userKey: "USR14", name: "Donor User", userId: "donor.user", firstName: "Donor", middleName: "", lastName: "User", email: "donor@example.com", phone: "1111111111", password: "admin", roles: ["Donor"], privileges: [], groups: [], isActive: true, gender: 'Other', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },

    // Hardcoded Beneficiary user
    { userKey: "USR15", name: "Beneficiary User", userId: "beneficiary.user", firstName: "Beneficiary", middleName: "", lastName: "User", email: "beneficiary@example.com", phone: "2222222222", password: "admin", roles: ["Beneficiary"], privileges: [], groups: [], isActive: true, gender: 'Other', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    
    // New test beneficiary
    { userKey: "USR16", name: "Test Ready Beneficiary", userId: "test.ready.beneficiary", firstName: "TestReady", lastName: "Beneficiary", email: "test.ready@example.com", phone: "9876543210", password: "admin", roles: ["Beneficiary"], isActive: true, gender: 'Other', beneficiaryType: 'Adult', source: 'Seeded' }
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
    { userKey: "USR17", name: "Salim Operation", userId: "salim.operation", firstName: "Salim", lastName: "Operation", email: "salim.op@example.com", phone: "4444444401", password: "admin", roles: ["Beneficiary"], isActive: true, gender: 'Male', beneficiaryType: 'Adult', source: 'Seeded' },
    ...Array.from({ length: 10 }, (_, i) => ({
        userKey: `USR${18 + i}`,
        name: `Ration Family ${i + 1}`,
        userId: `ration.family.${i + 1}`,
        firstName: `RationFamily${i+1}`,
        lastName: "User",
        email: `ration${i+1}@example.com`,
        phone: `55555555${i.toString().padStart(2, '0')}`,
        password: "admin",
        roles: ["Beneficiary"] as UserRole[],
        isActive: true,
        gender: 'Other' as 'Other',
        beneficiaryType: 'Family' as 'Family',
        source: 'Seeded'
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

// WINTER CAMPAIGN DATA
const winterCampaignUsers: Omit<User, 'id' | 'createdAt'>[] = [
    { userKey: "USR28", name: "Winter Beneficiary A", userId: "winter.beneficiary.a", firstName: "Winter", lastName: "Beneficiary A", email: "winter.a@example.com", phone: "8888888801", password: "admin", roles: ["Beneficiary"], isActive: true, gender: 'Other', beneficiaryType: 'Family', source: 'Seeded' },
    { userKey: "USR29", name: "Winter Beneficiary B", userId: "winter.beneficiary.b", firstName: "Winter", lastName: "Beneficiary B", email: "winter.b@example.com", phone: "8888888802", password: "admin", roles: ["Beneficiary"], isActive: true, gender: 'Other', beneficiaryType: 'Family', source: 'Seeded' },
];

const winterCampaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'> = {
    name: "Winter Relief 2024",
    description: "A campaign to provide blankets and warm clothing to families during the cold winter months.",
    goal: 50000,
    status: 'Active',
    startDate: Timestamp.fromDate(new Date("2024-11-01")),
    endDate: Timestamp.fromDate(new Date("2024-12-31")),
};


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
        if (userData.roles.includes('Super Admin')) {
            userData.isActive = true;
        }

        const id = userData.userId;
        if (!id) {
            results.push({ name: userData.name, status: 'Failed' });
            console.error(`User ${userData.name} is missing a userId in the seed data.`);
            continue;
        }
        
        let existingUser: User | null = await getUserByUserId(userData.userId);
        if (!existingUser && userData.email) {
            existingUser = await getUserByEmail(userData.email);
        }
        if (!existingUser) {
            existingUser = await getUserByPhone(userData.phone);
        }
        
        if (existingUser) {
            await updateUser(existingUser.id!, userData);
            results.push({ name: userData.name, status: 'Updated' });
        } else {
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
    const orgQuery = query(collection(db, 'organizations'), limit(1));
    const snapshot = await getDocs(orgQuery);

    if (!snapshot.empty) {
        const orgDoc = snapshot.docs[0];
        // Ensure the ID from the document is used for the update
        await updateDoc(doc(db, 'organizations', orgDoc.id), {
            ...organizationToSeed,
            updatedAt: serverTimestamp()
        });
        return 'Organization details updated successfully.';
    }
    
    console.log('Seeding organization...');
    await createOrganization(organizationToSeed);
    return 'Organization seeded successfully.';
};

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const seedCampaignAndData = async (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>, userData: Omit<User, 'id' | 'createdAt'>[], leadsData: any[]) => {
    const campaignResults: SeedItemResult[] = [];
    const leadResults: SeedItemResult[] = [];
    const donationResults: SeedItemResult[] = [];

    // Seed users first
    await seedUsers(userData);

    // Check if campaign exists
    const campaignRef = doc(db, 'campaigns', campaignData.name.replace(/\s+/g, '-').toLowerCase());
    const campaignDoc = await getDoc(campaignRef);

    if (campaignDoc.exists()) {
        campaignResults.push({ name: campaignData.name, status: 'Skipped (already exists)' });
        return { campaignResults, leadResults, donationResults };
    }

    const batch = writeBatch(db);
    batch.set(campaignRef, { ...campaignData, id: campaignRef.id, createdAt: Timestamp.now(), updatedAt: Timestamp.now(), source: 'Seeded' });
    campaignResults.push({ name: campaignData.name, status: 'Created' });

    const verifierAdmin = await getUserByPhone("7887646583");
    if (!verifierAdmin) throw new Error("Verifier admin (7887646583) not found.");

    const verifier: Verifier = {
        verifierId: verifierAdmin.id!,
        verifierName: verifierAdmin.name,
        verifiedAt: Timestamp.now(),
        notes: "Verified as part of campaign data import."
    };

    const allDonors = (await getAllUsers()).filter(u => u.roles.includes('Donor') && u.name !== 'Anonymous Donor');
    if (allDonors.length === 0) throw new Error("No donor users found for campaign seeding.");

    for (const leadInfo of leadsData) {
        const beneficiary = await getUserByPhone(leadInfo.phone);
        if (!beneficiary) continue;

        const leadId = `${campaignRef.id}_${beneficiary.userKey}`;
        const existingLead = await getLead(leadId);
        if (existingLead) {
            leadResults.push({ name: `Lead for ${beneficiary.name}`, status: 'Skipped (already exists)' });
            continue;
        }
        
        const leadRef = doc(db, 'leads', leadId);
        const randomDonor = allDonors[Math.floor(Math.random() * allDonors.length)];
        
        const newLead: Partial<Lead> = {
            id: leadRef.id, name: beneficiary.name, beneficiaryId: beneficiary.id!,
            campaignId: campaignRef.id, campaignName: campaignData.name,
            purpose: leadInfo.purpose, category: leadInfo.category, donationType: leadInfo.donationType,
            helpRequested: leadInfo.amount, helpGiven: leadInfo.isFunded ? leadInfo.amount : 0,
            status: leadInfo.isFunded ? 'Closed' : 'Ready For Help',
            isLoan: leadInfo.isLoan || false,
            caseDetails: leadInfo.details,
            verifiedStatus: 'Verified', verifiers: [verifier],
            dateCreated: Timestamp.now(), adminAddedBy: { id: verifierAdmin.id, name: verifierAdmin.name },
            source: 'Seeded'
        };

        if (leadInfo.isFunded) {
            const randomDonationDate = getRandomDate(new Date('2021-01-01'), new Date('2025-12-31'));
            const verifiedDate = new Date(randomDonationDate.getTime() + 86400000); // 1 day later
            
            const newDonation = await createDonation({
                donorId: randomDonor.id!, donorName: randomDonor.name, amount: leadInfo.amount,
                type: leadInfo.donationType, purpose: leadInfo.purpose, status: 'Allocated', isAnonymous: false,
                donationDate: Timestamp.fromDate(randomDonationDate), 
                verifiedAt: Timestamp.fromDate(verifiedDate),
                campaignId: campaignRef.id, leadId: leadRef.id, source: 'Seeded'
            }, verifierAdmin.id!, verifierAdmin.name, verifierAdmin.email);

            newLead.donations = [{ donationId: newDonation.id!, amount: leadInfo.amount, allocatedAt: Timestamp.now(), allocatedByUserId: verifierAdmin.id, allocatedByUserName: verifierAdmin.name }];
            donationResults.push({ name: `Donation for ${beneficiary.name}`, status: 'Created' });
        }
        
        batch.set(leadRef, newLead);
        leadResults.push({ name: `Lead for ${beneficiary.name}`, status: 'Created' });
    }

    await batch.commit();
    return { campaignResults, leadResults, donationResults };
}

const seedTestDonation = async (adminUser: User): Promise<SeedItemResult> => {
    const donor = await getUserByUserId("donor.user");
    if (!donor) {
        console.log("Test donor 'donor.user' not found, skipping test donation seed.");
        return { name: "Test Donation 4k", status: "Skipped (already exists)" };
    }

    const donationsCollection = collection(db, 'donations');
    const q = query(donationsCollection, 
        where("donorId", "==", donor.id!), 
        where("amount", "==", 4000),
        where("status", "==", "Verified"),
        where("source", "==", "Seeded-Test")
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
        return { name: "Test Donation 4k", status: "Skipped (already exists)" };
    }

    const randomDonationDate = getRandomDate(new Date('2021-01-01'), new Date());
    const verifiedDate = new Date(randomDonationDate.getTime() + 86400000); // 1 day later

    await createDonation({
        donorId: donor.id!,
        donorName: donor.name,
        amount: 4000,
        type: 'Sadaqah',
        purpose: 'To Organization Use',
        status: 'Verified',
        isAnonymous: false,
        donationDate: Timestamp.fromDate(randomDonationDate),
        verifiedAt: Timestamp.fromDate(verifiedDate),
        source: 'Seeded-Test',
        transactionId: `TEST-DONATION-4K-${Date.now()}`
    }, adminUser.id!, adminUser.name, adminUser.email);
    
    return { name: "Test Donation 4k", status: 'Created' };
}

export const seedDatabase = async (): Promise<SeedResult> => {
    console.log('Attempting to seed database...');
    if (!isConfigValid) {
        const errorMsg = "Firebase is not configured. Aborting seed.";
        console.error(errorMsg);
        return { userResults: [], donationResults: [], leadResults: [], campaignResults: [], orgStatus: 'Failed', quotesStatus: 'Failed', error: errorMsg };
    }

    const results: SeedResult = { userResults: [], donationResults: [], leadResults: [], campaignResults: [], orgStatus: 'Pending...', quotesStatus: 'Pending...' };

    try {
        console.log("Seeding core admin users...");
        results.userResults.push(...await seedUsers(adminUsersToSeed));
        
        const superAdmin = await getUserByPhone("9999999999");
        if (!superAdmin) throw new Error("Super admin user not found after seeding.");

        results.donationResults.push(await seedTestDonation(superAdmin));

        results.orgStatus = await seedOrganization();
        results.quotesStatus = await seedInitialQuotes();
        
        // Check if historical leads exist before trying to create them.
        const historicalCheckQuery = query(collection(db, 'leads'), where('source', '==', 'Seeded'), where('campaignId', '==', undefined), limit(1));
        const historicalSnapshot = await getDocs(historicalCheckQuery);
        if (historicalSnapshot.empty) {
             console.log("No historical leads found. Seeding is disabled to prevent duplicates.");
        }


        // Seed Ramadan Campaign
        const ramadanLeads = [
            { phone: ramadanCampaignUsers[0].phone, amount: 60000, isFunded: true, isLoan: true, purpose: 'Medical', category: 'Surgical Procedure', donationType: 'Zakat', details: 'Assistance for a major operation, as part of Ramadan drive.' },
            ...ramadanCampaignUsers.slice(1).map(u => ({ phone: u.phone, amount: 4000, isFunded: true, isLoan: false, purpose: 'Relief Fund', category: 'Ration Kit', donationType: 'Zakat', details: 'Ramadan ration kit for a family in need.' }))
        ];
        const ramadanResult = await seedCampaignAndData(ramadanCampaign, ramadanCampaignUsers, ramadanLeads);
        results.campaignResults.push(...ramadanResult.campaignResults);
        results.leadResults.push(...ramadanResult.leadResults);
        results.donationResults.push(...ramadanResult.donationResults);

        // Seed Winter Campaign
        const winterLeads = [
            { phone: winterCampaignUsers[0].phone, amount: 2500, isFunded: false, purpose: 'Relief Fund', category: 'Winter Kit', donationType: 'Sadaqah', details: 'Help for winter clothing and blankets for Winter Beneficiary A.' },
            { phone: winterCampaignUsers[1].phone, amount: 3500, isFunded: false, purpose: 'Relief Fund', category: 'Winter Kit', donationType: 'Sadaqah', details: 'Help for winter clothing and blankets for Winter Beneficiary B.' }
        ];
        const winterResult = await seedCampaignAndData(winterCampaign, winterCampaignUsers, winterLeads);
        results.campaignResults.push(...winterResult.campaignResults);
        results.leadResults.push(...winterResult.leadResults);

    } catch (e: any) {
        console.error("Seeding failed:", e);
        results.error = e.message;
    }

    console.log('Database seeding process completed.');
    return results;
};
