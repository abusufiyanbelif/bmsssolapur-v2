

import { seedUsers, seedCampaigns, seedLeads, seedDonations, type SeedResult } from '@/services/seed-service';
import type { User, Lead, Campaign, Donation } from '@/services/types';
import { USERS_COLLECTION, LEADS_COLLECTION, DONATIONS_COLLECTION, CAMPAIGNS_COLLECTION, PUBLIC_LEADS_COLLECTION, PUBLIC_CAMPAIGNS_COLLECTION } from '@/services/constants';

const sampleBeneficiaries: Omit<User, 'id' | 'createdAt' | 'userKey'>[] = [
    { name: "Salim Baig", userId: "salim.baig", firstName: "Salim", lastName: "Baig", email: "salim.baig@example.com", phone: "9876543211", roles: ['Beneficiary'], isActive: true, gender: 'Male', source: 'Seeded' },
    { name: "Fatima Khan", userId: "fatima.khan", firstName: "Fatima", lastName: "Khan", email: "fatima.khan@example.com", phone: "9876543212", roles: ['Beneficiary'], isActive: true, gender: 'Female', source: 'Seeded' },
    { name: "Irfan Pathan", userId: "irfan.pathan", firstName: "Irfan", lastName: "Pathan", email: "irfan.pathan@example.com", phone: "9876543213", roles: ['Beneficiary'], isActive: true, gender: 'Male', source: 'Seeded' },
    { name: "Aisha Begum", userId: "aisha.begum", firstName: "Aisha", lastName: "Begum", email: "aisha.begum@example.com", phone: "9876543214", roles: ['Beneficiary'], isActive: true, gender: 'Female', isWidow: true, beneficiaryType: 'Widow', source: 'Seeded' },
    { name: "Zoya Akhtar", userId: "zoya.akhtar", firstName: "Zoya", lastName: "Akhtar", email: "zoya.akhtar@example.com", phone: "9876543215", roles: ['Beneficiary'], isActive: true, gender: 'Female', source: 'Seeded' },
];

const dummyDonors: Omit<User, 'id' | 'createdAt' | 'userKey'>[] = Array.from({ length: 20 }, (_, i) => ({
  name: `Donor ${i + 1}`,
  userId: `donor.${i + 1}`,
  firstName: "Dummy",
  lastName: `Donor ${i + 1}`,
  email: `donor${i+1}@example.com`,
  phone: `90000000${i.toString().padStart(2, '0')}`,
  roles: ['Donor'],
  isActive: true,
  gender: 'Male',
  source: 'Seeded'
}));

const campaignsToSeed: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        name: "Ramadan 2025 Campaign",
        id: "ramadan-2025",
        description: "A campaign to raise funds for Zakat, Fitr, and general Sadaqah during the holy month of Ramadan 2025. Funds will be distributed for ration kits, education, and medical aid.",
        goal: 500000,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-30'),
        status: 'Completed',
        isHistoricalRecord: true,
        source: 'Seeded',
        acceptableDonationTypes: ['Zakat', 'Sadaqah', 'Fitr', 'Lillah'],
        imageUrl: 'https://picsum.photos/seed/ramadan/600/400',
    },
    {
        name: "Winter Relief 2025 Campaign",
        id: "winter-relief-2025",
        description: "Provide warm clothes, blankets, and essential supplies to needy families during the cold winter months.",
        goal: 50000,
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-12-31'),
        status: 'Active',
        isHistoricalRecord: false,
        source: 'Seeded',
        acceptableDonationTypes: ['Sadaqah', 'Lillah'],
        imageUrl: 'https://picsum.photos/seed/winter/600/400',
    },
    {
        name: "Ramadan 2026 Campaign",
        id: "ramadan-2026",
        description: "Upcoming campaign for Ramadan 2026 to provide ration kits and support to families.",
        goal: 750000,
        startDate: new Date('2026-02-18'),
        endDate: new Date('2026-03-20'),
        status: 'Upcoming',
        isHistoricalRecord: false,
        source: 'Seeded',
        acceptableDonationTypes: ['Zakat', 'Sadaqah', 'Fitr'],
        imageUrl: 'https://picsum.photos/seed/ramadan2/600/400',
    },
    {
        name: "SIO Flood Relief Campaign 2024",
        id: "sio-flood-relief-2024",
        description: "A campaign to provide immediate relief and rehabilitation to families affected by recent floods, in collaboration with Students Islamic Organisation (SIO).",
        goal: 200000,
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-09-30'),
        status: 'Active',
        isHistoricalRecord: false,
        source: 'Seeded',
        acceptableDonationTypes: ['Sadaqah', 'Lillah'],
        imageUrl: 'https://picsum.photos/seed/flood/600/400',
    },
];

const leadsToSeed: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'dateCreated' | 'adminAddedBy' | 'beneficiaryId' | 'name'>[] = [
    // Historical, generic leads
    { purpose: 'Medical', category: 'Hospital Bill', helpRequested: 15000, helpGiven: 15000, caseStatus: 'Closed', caseAction: 'Closed', isHistoricalRecord: true, caseVerification: 'Verified', source: 'Seeded' },
    { purpose: 'Loan', category: 'Emergency Loan', isLoan: true, helpRequested: 20000, helpGiven: 20000, caseStatus: 'Closed', caseAction: 'Closed', isHistoricalRecord: true, caseVerification: 'Verified', source: 'Seeded' },
    { purpose: 'Education', category: 'School Fees', helpRequested: 5000, helpGiven: 5000, caseStatus: 'Closed', caseAction: 'Closed', isHistoricalRecord: true, caseVerification: 'Verified', source: 'Seeded' },
    { purpose: 'Relief Fund', category: 'Financial Aid', helpRequested: 10000, helpGiven: 10000, caseStatus: 'Closed', caseAction: 'Closed', isHistoricalRecord: true, caseVerification: 'Verified', source: 'Seeded' },
    { purpose: 'Medical', category: 'Medication', helpRequested: 2500, helpGiven: 2500, caseStatus: 'Closed', caseAction: 'Closed', isHistoricalRecord: true, caseVerification: 'Verified', source: 'Seeded' },
    // Ramadan 2025 Campaign Leads
    { purpose: 'Loan', category: 'Business Loan', isLoan: true, helpRequested: 100000, helpGiven: 100000, caseStatus: 'Closed', caseAction: 'Closed', campaignId: 'ramadan-2025', caseVerification: 'Verified', source: 'Seeded' },
    { purpose: 'Medical', category: 'Surgical Procedure', helpRequested: 60000, helpGiven: 60000, caseStatus: 'Closed', caseAction: 'Closed', campaignId: 'ramadan-2025', caseVerification: 'Verified', source: 'Seeded' },
    // Winter Relief 2025 Leads
    { purpose: 'Relief Fund', category: 'Winter Kit', helpRequested: 2000, helpGiven: 500, caseStatus: 'Partial', caseAction: 'Partial', campaignId: 'winter-relief-2025', caseVerification: 'Verified', source: 'Seeded' },
    { purpose: 'Relief Fund', category: 'Winter Kit', helpRequested: 2000, helpGiven: 0, caseStatus: 'Open', caseAction: 'Publish', campaignId: 'winter-relief-2025', caseVerification: 'Verified', source: 'Seeded' },
    // Ramadan 2026 Leads
    { purpose: 'Relief Fund', category: 'Ration Kit', helpRequested: 4000, helpGiven: 0, caseStatus: 'Pending', caseAction: 'Pending', campaignId: 'ramadan-2026', caseVerification: 'Pending', source: 'Seeded' },
    { purpose: 'Relief Fund', category: 'Ration Kit', helpRequested: 4000, helpGiven: 0, caseStatus: 'Pending', caseAction: 'Pending', campaignId: 'ramadan-2026', caseVerification: 'Pending', source: 'Seeded' },
];

export async function seedSampleData(): Promise<SeedResult> {
    const details: string[] = [];
    const createdUserIds: Record<string, string> = {};

    // 1. Seed Beneficiaries
    const beneficiaryResult = await seedUsers([...sampleBeneficiaries, ...dummyDonors]);
    details.push(...beneficiaryResult);
    
    const allUsers = await getAllUsers();
    sampleBeneficiaries.forEach(b => {
        const user = allUsers.find(u => u.phone === b.phone);
        if(user) createdUserIds[b.name] = user.id!;
    });
     dummyDonors.forEach(d => {
        const user = allUsers.find(u => u.phone === d.phone);
        if(user) createdUserIds[d.name] = user.id!;
    });


    // 2. Seed Campaigns
    const campaignResult = await seedCampaigns(campaignsToSeed);
    details.push(campaignResult);

    // 3. Seed Leads and link to beneficiaries
    const leadsWithBeneficiaries = leadsToSeed.map((lead, i) => {
        const beneficiaryName = i < sampleBeneficiaries.length ? sampleBeneficiaries[i].name : sampleBeneficiaries[0].name;
        return {
            ...lead,
            name: beneficiaryName,
            beneficiaryId: createdUserIds[beneficiaryName],
        }
    });

    // Add 10 ration kit leads for Ramadan 2025
    for(let i=0; i<10; i++) {
        const beneficiaryName = sampleBeneficiaries[i % sampleBeneficiaries.length].name;
        leadsWithBeneficiaries.push({
            purpose: 'Relief Fund', category: 'Ration Kit', helpRequested: 4000, helpGiven: 4000, caseStatus: 'Closed', caseAction: 'Closed', campaignId: 'ramadan-2025', caseVerification: 'Verified', source: 'Seeded', name: beneficiaryName, beneficiaryId: createdUserIds[beneficiaryName]
        });
    }
    // Add 7 relief effort leads for Ramadan 2025
     for(let i=0; i<7; i++) {
        const beneficiaryName = sampleBeneficiaries[i % sampleBeneficiaries.length].name;
        leadsWithBeneficiaries.push({
            purpose: 'Relief Fund', category: 'Disaster Relief', helpRequested: 50000, helpGiven: 50000, caseStatus: 'Closed', caseAction: 'Closed', campaignId: 'ramadan-2025', caseVerification: 'Verified', source: 'Seeded', name: beneficiaryName, beneficiaryId: createdUserIds[beneficiaryName]
        });
    }

    const leadResult = await seedLeads(leadsWithBeneficiaries);
    details.push(leadResult);
    
    // 4. Seed Dummy Donations
    const allLeadsAfterSeed = await getAllLeads();
    const ramadanReliefLeads = allLeadsAfterSeed.filter(l => l.campaignId === 'ramadan-2025' && l.purpose === 'Relief Fund');
    const dummyDonations: Omit<Donation, 'id'>[] = [];
    let leadIndex = 0;
    
    dummyDonors.forEach(donor => {
        if(leadIndex < ramadanReliefLeads.length) {
            const lead = ramadanReliefLeads[leadIndex];
            dummyDonations.push({
                donorId: createdUserIds[donor.name],
                donorName: donor.name,
                amount: 25000,
                type: 'Zakat',
                purpose: 'Relief Fund',
                status: 'Verified',
                leadId: lead.id,
                campaignId: 'ramadan-2025',
                donationDate: new Date('2025-03-15'),
                source: 'Seeded',
            } as Omit<Donation, 'id'>);
            leadIndex++;
        }
    });
    
    const donationResult = await seedDonations(dummyDonations);
    details.push(donationResult);

    return { message: "Sample data seeded successfully.", details };
}

async function getAllUsers(): Promise<User[]> {
    const db = await getAdminDb();
    const snapshot = await db.collection(USERS_COLLECTION).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}

async function getAllLeads(): Promise<Lead[]> {
    const db = await getAdminDb();
    const snapshot = await db.collection(LEADS_COLLECTION).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
}

