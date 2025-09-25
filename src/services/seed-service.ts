
/**
 * @fileOverview A service to seed the database with initial data.
 */

import { createUser, User, UserRole, getUserByEmail, getUserByPhone, getAllUsers, updateUser, getUser, getUserByUserId } from './user-service';
import { createOrganization, Organization, getCurrentOrganization, OrganizationFooter } from './organization-service';
import { seedInitialQuotes as seedQuotesService } from './quotes-service';
import { db } from './firebase';
import { collection, getDocs, query, where, Timestamp, setDoc, doc, writeBatch, orderBy, getCountFromServer, limit, updateDoc, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore';
import type { Lead, Verifier, LeadDonationAllocation, Donation, Campaign, FundTransfer, LeadAction, AppSettings } from './types';
import { createLead, getLead } from './lead-service';
import { createCampaign, getCampaign } from './campaign-service';
import { createDonation } from './donation-service';
import { updateAppSettings } from './app-settings-service';

const USERS_COLLECTION = 'users';

const initialUsersToSeed: Omit<User, 'id' | 'createdAt'>[] = [
    // Super Admin
    { userKey: "USR01", name: "admin", userId: "admin", firstName: "Admin", lastName: "User", fatherName: "System", email: "admin@example.com", phone: "9999999999", password: "admin", roles: ["Super Admin"], privileges: ["all"], isActive: true, gender: 'Male', source: 'Seeded' },
];

const coreTeamUsersToSeed: Omit<User, 'id' | 'createdAt'>[] = [
     { 
        userKey: "USR02", 
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
    { userKey: "USR03", name: "Moosa Shaikh", userId: "moosa.shaikh", firstName: "Moosa", middleName: "", lastName: "Shaikh", fatherName: "", email: "moosa.shaikh@example.com", phone: "8421708907", password: "admin", roles: ["Admin", "Donor"], privileges: ["canManageLeads"], groups: ["Lead Approver"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, upiIds: ['8421708907@ybl'], source: 'Seeded' },
    { userKey: "USR04", name: "Maaz Shaikh", userId: "maaz.shaikh", firstName: "Maaz", middleName: "", lastName: "Shaikh", fatherName: "", email: "maaz.shaikh@example.com", phone: "9372145889", password: "admin", roles: ["Admin", "Finance Admin", "Donor"], privileges: ["canManageDonations", "canViewFinancials"], groups: ["Finance", "Lead Approver"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { userKey: "USR05", name: "AbuRehan Bedrekar", userId: "aburehan.bedrekar", firstName: "AbuRehan", middleName: "", lastName: "Bedrekar", fatherName: "", email: "aburehan.bedrekar@example.com", phone: "7276224160", password: "admin", roles: ["Admin", "Donor"], privileges: ["canManageLeads"], groups: ["Co-Founder", "Lead Approver"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { userKey: "USR06", name: "NayyarAhmed Karajgi", userId: "nayyarahmed.karajgi", firstName: "NayyarAhmed", middleName: "", lastName: "Karajgi", fatherName: "", email: "nayyar.karajgi@example.com", phone: "9028976036", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { userKey: "USR07", name: "Arif Baig", userId: "arif.baig", firstName: "Arif", middleName: "", lastName: "Baig", fatherName: "", email: "arif.baig@example.com", phone: "9225747045", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { userKey: "USR08", name: "Mazhar Shaikh", userId: "mazhar.shaikh", firstName: "Mazhar", middleName: "", lastName: "Shaikh", fatherName: "", email: "mazhar.shaikh@example.com", phone: "8087669914", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { userKey: "USR09", name: "Mujahid Chabukswar", userId: "mujahid.chabukswar", firstName: "Mujahid", middleName: "", lastName: "Chabukswar", fatherName: "", email: "mujahid.chabukswar@example.com", phone: "8087420544", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
    { userKey: "USR10", name: "Muddasir Shaikh", userId: "muddasir.shaikh", firstName: "Muddasir", middleName: "", lastName: "Shaikh", fatherName: "", email: "muddasir@example.com", phone: "7385557820", password: "admin", roles: ["Admin"], privileges: ["canManageLeads"], groups: ["Member of Organization"], isActive: true, gender: 'Male', address: { city: 'Solapur', state: 'Maharashtra', country: 'India' }, source: 'Seeded' },
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
    logoUrl: "https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect.appspot.com/o/app-assets%2Flogo-new.png?alt=media&token=c19733a0-f567-4335-8531-15b41951b6a7",
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
    qrCodeUrl: "https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect.appspot.com/o/app-assets%2FOrg_Temp_Maaz_QR_Code-Crop.jpg?alt=media&token=75638219-c638-4e12-870f-1538d6139c87",
    footer: defaultFooterContent,
};


// --- HISTORICAL/GENERAL LEADS ---
const generalBeneficiaryUsers: Omit<User, 'id' | 'createdAt'>[] = [
    { userKey: "USR101", name: "Aisha Begum", userId: "aisha.begum", firstName: "Aisha", lastName: "Begum", fatherName: "Mohammed Ali", email: "aisha.b@example.com", phone: "9876543211", password: "admin", roles: ["Beneficiary"], isActive: true, gender: 'Female', beneficiaryType: 'Widow', isWidow: true, source: 'Seeded' },
    { userKey: "USR102", name: "Ibrahim Khan", userId: "ibrahim.khan", firstName: "Ibrahim", lastName: "Khan", fatherName: "Yusuf Khan", email: "ibrahim.k@example.com", phone: "9876543212", password: "admin", roles: ["Beneficiary"], isActive: true, gender: 'Male', beneficiaryType: 'Adult', source: 'Seeded' },
    { userKey: "USR103", name: "Fatima Syed", userId: "fatima.syed", firstName: "Fatima", lastName: "Syed", fatherName: "Ali Syed", email: "fatima.s@example.com", phone: "9876543213", password: "admin", roles: ["Beneficiary"], isActive: true, gender: 'Female', beneficiaryType: 'Kid', source: 'Seeded' },
    { userKey: "USR104", name: "Yusuf Ahmed", userId: "yusuf.ahmed", firstName: "Yusuf", lastName: "Ahmed", fatherName: "Ahmed Sr.", email: "yusuf.a@example.com", phone: "9876543214", password: "admin", roles: ["Beneficiary"], isActive: true, gender: 'Male', beneficiaryType: 'Old Age', source: 'Seeded' },
    { userKey: "USR105", name: "Zainab Family", userId: "zainab.family", firstName: "Zainab", lastName: "Family", fatherName: "Anwar Shaikh", email: "zainab.f@example.com", phone: "9876543215", password: "admin", roles: ["Beneficiary"], isActive: true, gender: 'Female', beneficiaryType: 'Family', source: 'Seeded' },
];

const generalLeadsData = [
    { phone: "9876543211", amount: 15000, isFunded: true, purpose: 'Medical', category: 'Hospital Bill', donationType: 'Sadaqah', details: 'Assistance for emergency medical bill for a widow.' },
    { phone: "9876543212", amount: 20000, isFunded: true, purpose: 'Loan', category: 'Business Loan', donationType: 'Lillah', isLoan: true, details: 'Small loan to start a fruit cart business.' },
    { phone: "9876543213", amount: 8000, isFunded: true, purpose: 'Education', category: 'School Fees', donationType: 'Sadaqah', details: 'Support for annual school fees for a young student.' },
    { phone: "9876543214", amount: 3000, isFunded: true, purpose: 'Relief Fund', category: 'Medication', donationType: 'Lillah', details: 'Monthly medication support for an elderly individual.' },
    { phone: "9876543215", amount: 5000, isFunded: false, purpose: 'Relief Fund', category: 'Utility Bill Payment', donationType: 'Sadaqah', details: 'Help to pay pending electricity bills to avoid disconnection.' },
];


// RAMADAN 2025 CAMPAIGN DATA
const ramadanCampaignUsers: Omit<User, 'id' | 'createdAt'>[] = [
    { userKey: "USR17", name: "Salim Operation", userId: "salim.operation", firstName: "Salim", lastName: "Operation", fatherName: "Anwar Operation", email: "salim.op@example.com", phone: "4444444401", password: "admin", roles: ["Beneficiary"], isActive: true, gender: 'Male', beneficiaryType: 'Adult', source: 'Seeded' },
    { userKey: "USR18", name: "Salim Baig", userId: "salim.baig", firstName: "Salim", lastName: "Baig", fatherName: "Anwar Baig", email: "salim.baig@example.com", phone: "4444444402", password: "admin", roles: ["Beneficiary"], isActive: true, gender: 'Male', beneficiaryType: 'Adult', source: 'Seeded' },
    ...Array.from({ length: 10 }, (_, i) => ({
        userKey: `USR${19 + i}`,
        name: `Ration Family ${i + 1}`,
        userId: `ration.family.${i + 1}`,
        firstName: `RationFamily${i+1}`,
        lastName: "User",
        fatherName: "Father User",
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


const ramadan2025Campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'> = {
    name: "Ramadan 2025 Zakat Drive",
    description: "A campaign to collect Zakat during Ramadan 2025 to help with critical operations and provide ration kits to families in need.",
    goal: 150000,
    status: 'Completed',
    startDate: Timestamp.fromDate(new Date("2025-03-01")),
    endDate: Timestamp.fromDate(new Date("2025-03-30")),
    source: 'Seeded',
};

// WINTER CAMPAIGN DATA
const winterCampaignUsers: Omit<User, 'id' | 'createdAt'>[] = [
    { userKey: "USR29", name: "Winter Beneficiary A", userId: "winter.beneficiary.a", firstName: "Winter", lastName: "Beneficiary A", fatherName: "Father A", email: "winter.a@example.com", phone: "8888888801", password: "admin", roles: ["Beneficiary"], isActive: true, gender: 'Other', beneficiaryType: 'Family', source: 'Seeded' },
    { userKey: "USR30", name: "Winter Beneficiary B", userId: "winter.beneficiary.b", firstName: "Winter", lastName: "Beneficiary B", fatherName: "Father B", email: "winter.b@example.com", phone: "8888888802", password: "admin", roles: ["Beneficiary"], isActive: true, gender: 'Other', beneficiaryType: 'Family', source: 'Seeded' },
];

const winterCampaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'> = {
    name: "Winter Relief 2024",
    description: "A campaign to provide blankets and warm clothing to families during the cold winter months.",
    goal: 50000,
    status: 'Active',
    startDate: Timestamp.fromDate(new Date("2024-11-01")),
    endDate: Timestamp.fromDate(new Date("2024-12-31")),
    source: 'Seeded',
};

// RAMADAN 2026 CAMPAIGN DATA
const ramadan2026CampaignUsers: Omit<User, 'id' | 'createdAt'>[] = [
    { userKey: "USR31", name: "Future Ration Family 1", userId: "future.ration.1", firstName: "Future", lastName: "Family 1", fatherName: "Future Father 1", email: "future1@example.com", phone: "6666666601", password: "admin", roles: ["Beneficiary"], isActive: true, gender: 'Other', beneficiaryType: 'Family', source: 'Seeded' },
    { userKey: "USR32", name: "Future Ration Family 2", userId: "future.ration.2", firstName: "Future", lastName: "Family 2", fatherName: "Future Father 2", email: "future2@example.com", phone: "6666666602", password: "admin", roles: ["Beneficiary"], isActive: true, gender: 'Other', beneficiaryType: 'Family', source: 'Seeded' },
];

const ramadan2026Campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'> = {
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

const seedUsers = async (users: Omit<User, 'id' | 'createdAt'>[]): Promise<string[]> => {
    const results: string[] = [];

    for (const userData of users) {
        if (userData.userId === 'admin') {
            const adminUserRef = doc(db, USERS_COLLECTION, 'ADMIN_USER_ID');
            const adminUserDoc = await getDoc(adminUserRef);

            if (!adminUserDoc.exists()) {
                await setDoc(adminUserRef, { ...userData, id: 'ADMIN_USER_ID', createdAt: Timestamp.now(), source: 'Seeded' });
                results.push(`${userData.name} created.`);
            } else {
                await updateDoc(adminUserRef, { ...userData, updatedAt: serverTimestamp() });
                results.push(`${userData.name} updated.`);
            }
            continue;
        }

        let existingUser: User | null = null;
        if (userData.phone) existingUser = await getUserByPhone(userData.phone);
        if (!existingUser && userData.email) existingUser = await getUserByEmail(userData.email);
        if (!existingUser && userData.userId) existingUser = await getUserByUserId(userData.userId);


        if (existingUser) {
            const updatedRoles = [...new Set([...(existingUser.roles || []), ...userData.roles])];
            const updatedGroups = [...new Set([...(existingUser.groups || []), ...(userData.groups || [])])];
            
            const updatePayload: Partial<User> = { 
                ...userData, 
                roles: updatedRoles, 
                groups: updatedGroups,
            };
            delete (updatePayload as any).password; // Don't overwrite existing passwords
            await updateUser(existingUser.id!, updatePayload);
            results.push(`${userData.name} updated.`);
        } else {
            try {
                await createUser(userData);
                results.push(`${userData.name} created.`);
            } catch (e) {
                 results.push(`${userData.name} failed to create.`);
                 console.error(`Failed to create user ${userData.name}:`, e);
            }
        }
    }
    return results;
};

const seedOrganization = async (): Promise<string> => {
    const existingOrg = await getCurrentOrganization();
    if (existingOrg) {
        // If it exists, update it with the default footer content just in case it's missing
        await updateDoc(doc(db, 'organizations', existingOrg.id), { footer: defaultFooterContent });
        return "Organization profile updated with default footer.";
    }
    await createOrganization(organizationToSeed);
    return "Organization profile created successfully.";
}


const seedGeneralLeads = async (adminUser: User): Promise<string[]> => {
    const leadResults: string[] = [];
    
    await seedUsers(generalBeneficiaryUsers);

    const moosaShaikh = await getUserByPhone("8421708907");
    if (!moosaShaikh) throw new Error("Moosa Shaikh not found for general lead seeding.");
    
    const verifier: Verifier = {
        verifierId: moosaShaikh.id!,
        verifierName: moosaShaikh.name,
        verifiedAt: Timestamp.now(),
        notes: "Verified as part of historical data import."
    };

    const allDonors = (await getAllUsers()).filter(u => u.roles.includes('Donor') && u.name !== 'Anonymous Donor');
    if (allDonors.length === 0) throw new Error("No donor users found for general lead seeding.");
    
    for (const leadInfo of generalLeadsData) {
        const beneficiary = await getUserByPhone(leadInfo.phone);
        if (!beneficiary) continue;

        const leadId = `GEN_${beneficiary.userKey}_${Date.now()}`;
        const existingLead = await getDoc(doc(db, 'leads', leadId));
        if (existingLead.exists()) {
            leadResults.push(`General Lead for ${beneficiary.name} skipped.`);
            continue;
        }
        
        const caseAction: LeadAction = leadInfo.isFunded ? 'Closed' : 'Publish';

        const newLeadData: Partial<Lead> = {
            id: leadId, name: beneficiary.name, beneficiaryId: beneficiary.id!,
            purpose: leadInfo.purpose as any, category: leadInfo.category, donationType: leadInfo.donationType as any,
            helpRequested: leadInfo.amount, helpGiven: leadInfo.isFunded ? leadInfo.amount : 0,
            caseAction: caseAction,
            isLoan: leadInfo.isLoan || false,
            caseDetails: leadInfo.details,
            caseVerification: 'Verified', verifiers: [verifier],
            dateCreated: Timestamp.now(), adminAddedBy: { id: adminUser.id!, name: adminUser.name },
            source: 'Seeded'
        };

        if (leadInfo.isFunded) {
             const randomDonor = allDonors[Math.floor(Math.random() * allDonors.length)];
             const randomDonationDate = getRandomDate(new Date('2021-01-01'), new Date('2025-12-31'));
             const verifiedDate = new Date(randomDonationDate.getTime() + 86400000); // 1 day later
            
             const newDonation = await createDonation({
                donorId: randomDonor.id!, donorName: randomDonor.name, amount: leadInfo.amount,
                type: leadInfo.donationType as any, purpose: leadInfo.purpose as any, status: 'Allocated', isAnonymous: false,
                donationDate: Timestamp.fromDate(randomDonationDate), 
                verifiedAt: Timestamp.fromDate(verifiedDate),
                leadId: newLeadData.id!, source: 'Seeded'
            }, adminUser.id!, adminUser.name, adminUser.email);
            
            const newTransfer: FundTransfer = {
                transferredByUserId: adminUser.id!,
                transferredByUserName: adminUser.name,
                amount: leadInfo.amount,
                transferredAt: Timestamp.now() as any,
                proofUrl: 'https://placehold.co/600x400.png?text=seeded-transfer-proof',
                notes: 'Dummy transfer for seeded closed lead.',
                transactionId: `SEED_TXN_${newLeadData.id}`
            };
            
            newLeadData.donations = [{ donationId: newDonation.id!, amount: leadInfo.amount, allocatedAt: Timestamp.now() as any, allocatedByUserId: adminUser.id, allocatedByUserName: adminUser.name }];
            newLeadData.fundTransfers = [newTransfer];
        }
        
        await createLead(newLeadData, {id: adminUser.id!, name: adminUser.name});
        leadResults.push(`General Lead for ${beneficiary.name} created.`);
    }
    return leadResults;
};

const seedCampaignAndData = async (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>, userData: Omit<User, 'id' | 'createdAt'>[], leadsData: any[]): Promise<string[]> => {
    let results: string[] = [];

    // Seed users first
    await seedUsers(userData);

    // Check if campaign exists
    const campaignId = campaignData.name.toLowerCase().replace(/\s+/g, '-');
    const existingCampaign = await getCampaign(campaignId);

    if (existingCampaign) {
        results.push(`Campaign "${campaignData.name}" skipped.`);
        return results;
    }

    const campaignRef = doc(db, 'campaigns', campaignId);
    const batch = writeBatch(db);
    batch.set(campaignRef, { ...campaignData, id: campaignRef.id, createdAt: Timestamp.now(), updatedAt: Timestamp.now(), source: 'Seeded' });
    results.push(`Campaign "${campaignData.name}" created.`);

    const verifierAdmin = await getUserByUserId("abusufiyan.belif");
    const moosaShaikh = await getUserByPhone("8421708907");
    if (!verifierAdmin || !moosaShaikh) throw new Error("Required admin users for seeding not found.");

    const historicalVerifier: Verifier = {
        verifierId: moosaShaikh.id!,
        verifierName: moosaShaikh.name,
        verifiedAt: Timestamp.now() as any,
        notes: "Verified as part of historical data import."
    };
    
     const currentVerifier: Verifier = {
        verifierId: verifierAdmin.id!,
        verifierName: verifierAdmin.name,
        verifiedAt: Timestamp.now() as any,
        notes: "Verified as part of campaign data import."
    };

    const verifierToUse = campaignData.status === 'Completed' ? historicalVerifier : currentVerifier;
    const allDonors = (await getAllUsers()).filter(u => u.roles.includes('Donor') && u.name !== 'Anonymous Donor');
    if (allDonors.length === 0) throw new Error("No donor users found for campaign seeding.");

    for (const leadInfo of leadsData) {
        const beneficiary = await getUserByPhone(leadInfo.phone);
        if (!beneficiary) continue;

        const leadId = `${campaignRef.id}_${beneficiary.userKey}`;
        const existingLead = await getDoc(doc(db, 'leads', leadId));
        if (existingLead.exists()) {
            results.push(`Lead for ${beneficiary.name} in ${campaignData.name} skipped.`);
            continue;
        }
        
        const leadRef = doc(db, 'leads', leadId);
        let leadAction: LeadAction = 'Pending';
        if(campaignData.status === 'Upcoming') {
            leadAction = 'Pending';
        } else if (leadInfo.isFunded) {
            leadAction = 'Closed';
        } else {
            leadAction = 'Publish';
        }

        const newLead: Partial<Lead> = {
            id: leadRef.id, name: beneficiary.name, beneficiaryId: beneficiary.id!,
            campaignId: campaignRef.id, campaignName: campaignData.name,
            purpose: leadInfo.purpose, category: leadInfo.category, donationType: leadInfo.donationType,
            helpRequested: leadInfo.amount, helpGiven: leadInfo.isFunded ? leadInfo.amount : 0,
            caseAction: leadAction, isLoan: leadInfo.isLoan || false,
            caseDetails: leadInfo.details, caseVerification: 'Verified', verifiers: [verifierToUse],
            dateCreated: Timestamp.now(), adminAddedBy: { id: verifierAdmin.id, name: verifierAdmin.name },
            source: 'Seeded'
        };

        if (leadInfo.isFunded) {
            const randomDonationDate = getRandomDate(new Date('2021-01-01'), new Date('2025-12-31'));
            const verifiedDate = new Date(randomDonationDate.getTime() + 86400000); // 1 day later
            
            const newDonation = await createDonation({
                donorId: allDonors[0].id!, donorName: allDonors[0].name, amount: leadInfo.amount,
                type: leadInfo.donationType, purpose: leadInfo.purpose, status: 'Allocated', isAnonymous: false,
                donationDate: Timestamp.fromDate(randomDonationDate), 
                verifiedAt: Timestamp.fromDate(verifiedDate),
                campaignId: campaignRef.id, leadId: leadRef.id, source: 'Seeded'
            }, verifierAdmin.id!, verifierAdmin.name, verifierAdmin.email);
            
            const newTransfer: FundTransfer = {
                transferredByUserId: verifierAdmin.id!,
                transferredByUserName: verifierAdmin.name,
                amount: leadInfo.amount,
                transferredAt: Timestamp.now() as any,
                proofUrl: 'https://placehold.co/600x400.png?text=seeded-transfer-proof',
                notes: 'Dummy transfer for seeded closed lead.',
                transactionId: `SEED_TXN_${leadRef.id}`
            };
            
            newLead.donations = [{ donationId: newDonation.id!, amount: leadInfo.amount, allocatedAt: Timestamp.now() as any, allocatedByUserId: verifierAdmin.id, allocatedByUserName: verifierAdmin.name }];
            newLead.fundTransfers = [newTransfer];
        }
        
        batch.set(leadRef, newLead);
        results.push(`Lead for ${beneficiary.name} in ${campaignData.name} created.`);
    }

    await batch.commit();
    return results;
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper to delete all documents in a collection
async function deleteCollection(collectionPath: string): Promise<number> {
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef, limit(100)); // Limit to avoid memory issues
    
    let deletedCount = 0;
    let snapshot = await getDocs(q);

    while (snapshot.size > 0) {
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        deletedCount += snapshot.size;
        snapshot = await getDocs(q);
    }
    return deletedCount;
}


// --- EXPORTED SEEDING FUNCTIONS ---

export const seedInitialUsersAndQuotes = async (): Promise<SeedResult> => {
    const userResults = await seedUsers(initialUsersToSeed);
    const quotesStatus = await seedQuotesService();
    return {
        message: 'Initial Seeding Complete',
        details: [...userResults, quotesStatus]
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

export const seedPaymentGateways = async (): Promise<SeedResult> => {
    const updates: Partial<AppSettings> = {
      paymentGateway: {
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
        phonepe: { enabled: false, mode: 'test', test: {}, live: {} },
        paytm: { enabled: false, mode: 'test', test: {}, live: {} },
        cashfree: { enabled: false, mode: 'test', test: {}, live: {} },
        instamojo: { enabled: false, mode: 'test', test: {}, live: {} },
        stripe: { enabled: false, mode: 'test', test: {}, live: {} },
      },
      features: {
        onlinePaymentsEnabled: true,
        directPaymentToBeneficiary: { enabled: false }
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

    const superAdmin = await getUserByUserId("abusufiyan.belif");
    if (!superAdmin) throw new Error("Super admin user 'abusufiyan.belif' not found. Please run initial seed first.");

    // Seed General Leads
    details.push(...await seedGeneralLeads(superAdmin));

    // Seed Ramadan 2025 Campaign
    const ramadanLeads = [
        { phone: "4444444401", amount: 60000, isFunded: true, isLoan: true, purpose: 'Medical', category: 'Surgical Procedure', donationType: 'Zakat', details: 'Assistance for a major operation, as part of Ramadan drive.' },
        { phone: "4444444402", amount: 100000, isFunded: true, isLoan: true, purpose: 'Loan', category: 'Business Loan', donationType: 'Any', details: 'Business expansion loan for Salim Baig.' },
        ...ramadanCampaignUsers.slice(2).map(u => ({ phone: u.phone, amount: 4000, isFunded: true, isLoan: false, purpose: 'Relief Fund', category: 'Ration Kit', donationType: 'Zakat', details: 'Ramadan ration kit for a family in need.' }))
    ];
    details.push(...await seedCampaignAndData(ramadan2025Campaign, ramadanCampaignUsers, ramadanLeads));

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
    const details: string[] = [];
    const batch = writeBatch(db);

    // Delete admin user
    const adminUserRef = doc(db, USERS_COLLECTION, 'ADMIN_USER_ID');
    batch.delete(adminUserRef);
    details.push('Admin user scheduled for deletion.');

    // Delete quotes
    const quotesDeleted = await deleteCollection('inspirationalQuotes');
    details.push(`Deleted ${quotesDeleted} quotes.`);

    await batch.commit();

    return {
        message: 'Initial Data Erased',
        details: details
    };
};

export const eraseCoreTeam = async (): Promise<SeedResult> => {
    const phonesToDelete = coreTeamUsersToSeed.map(u => u.phone);
    const usersToDeleteQuery = query(collection(db, USERS_COLLECTION), where("phone", "in", phonesToDelete));
    const snapshot = await getDocs(usersToDeleteQuery);

    if(snapshot.empty) {
        return { message: "No core team members found to erase.", details: [] };
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return {
        message: `Erased ${snapshot.size} core team members.`,
        details: snapshot.docs.map(d => `${d.data().name} (${d.data().phone}) deleted.`)
    };
};

export const eraseOrganizationProfile = async (): Promise<SeedResult> => {
    const org = await getCurrentOrganization();
    if (!org) {
        return { message: "No organization profile found to erase.", details: [] };
    }
    await deleteDoc(doc(db, 'organizations', org.id));
    // Also delete public record
    await deleteDoc(doc(db, 'publicData', 'organization'));
    return {
        message: 'Organization Profile Erased',
        details: [`Deleted profile for "${org.name}".`]
    };
};

export const erasePaymentGateways = async (): Promise<SeedResult> => {
    const updates: Partial<AppSettings> = {
        paymentGateway: {
            razorpay: {
                enabled: false,
                mode: 'test',
                test: { keyId: '', keySecret: '' },
                live: { keyId: '', keySecret: '' }
            },
            phonepe: { enabled: false, mode: 'test', test: {}, live: {} },
            paytm: { enabled: false, mode: 'test', test: {}, live: {} },
            cashfree: { enabled: false, mode: 'test', test: {}, live: {} },
            instamojo: { enabled: false, mode: 'test', test: {}, live: {} },
            stripe: { enabled: false, mode: 'test', test: {}, live: {} },
        },
        features: { onlinePaymentsEnabled: false, directPaymentToBeneficiary: {enabled: false} }
    };
    await updateAppSettings(updates);
    return {
        message: 'Payment Gateway Settings Erased',
        details: ["Razorpay test credentials have been cleared and the gateway is disabled."]
    };
};

export const eraseSampleData = async (): Promise<SeedResult> => {
    const details: string[] = [];
    const batch = writeBatch(db);
    
    // Find all seeded data
    const seededUsersQuery = query(collection(db, USERS_COLLECTION), where("source", "==", "Seeded"));
    const seededLeadsQuery = query(collection(db, 'leads'), where("source", "==", "Seeded"));
    const seededDonationsQuery = query(collection(db, 'donations'), where("source", "==", "Seeded"));
    const seededCampaignsQuery = query(collection(db, 'campaigns'), where("source", "==", "Seeded"));
    
    const [users, leads, donations, campaigns] = await Promise.all([
        getDocs(seededUsersQuery),
        getDocs(seededLeadsQuery),
        getDocs(seededDonationsQuery),
        getDocs(seededCampaignsQuery),
    ]);

    users.docs.forEach(doc => {
        // Prevent deleting the main admin users if they were seeded
        if (doc.id !== 'ADMIN_USER_ID' && doc.data().phone !== '7887646583') {
           batch.delete(doc.ref);
        }
    });
    details.push(`Deleted ${users.size} seeded users.`);
    
    leads.docs.forEach(doc => batch.delete(doc.ref));
    details.push(`Deleted ${leads.size} seeded leads.`);
    
    donations.docs.forEach(doc => batch.delete(doc.ref));
    details.push(`Deleted ${donations.size} seeded donations.`);

    campaigns.docs.forEach(doc => batch.delete(doc.ref));
    details.push(`Deleted ${campaigns.size} seeded campaigns.`);

    await batch.commit();

    return {
        message: 'Sample Data Erased',
        details: details,
    };
};
