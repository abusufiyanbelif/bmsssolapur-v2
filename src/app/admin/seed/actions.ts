
'use server';

import { 
    seedInitialUsersAndQuotes, 
    seedCoreTeam, 
    seedOrganizationProfile, 
    seedPaymentGateways,
    seedSampleData,
    eraseInitialUsersAndQuotes,
    eraseCoreTeam,
    eraseOrganizationProfile,
    erasePaymentGateways,
    eraseSampleData,
    type SeedResult
} from "@/services/seed-service";

type SeedTask = 'initial' | 'coreTeam' | 'organization' | 'paymentGateways' | 'sampleData';

export async function handleSeedAction(task: SeedTask): Promise<{success: boolean; data?: SeedResult; error?: string}> {
    try {
        let result: SeedResult;
        switch(task) {
            case 'initial':
                result = await seedInitialUsersAndQuotes();
                break;
            case 'coreTeam':
                result = await seedCoreTeam();
                break;
            case 'organization':
                result = await seedOrganizationProfile();
                break;
            case 'paymentGateways':
                result = await seedPaymentGateways();
                break;
            case 'sampleData':
                result = await seedSampleData();
                break;
            default:
                throw new Error("Invalid seed task provided.");
        }
        return { success: true, data: result };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred during seeding.";
        console.error(`Seeding task '${task}' failed:`, error);
        return { success: false, error };
    }
}


export async function handleEraseAction(task: SeedTask): Promise<{success: boolean; data?: SeedResult; error?: string}> {
    try {
        let result: SeedResult;
        switch(task) {
            case 'initial':
                result = await eraseInitialUsersAndQuotes();
                break;
            case 'coreTeam':
                result = await eraseCoreTeam();
                break;
            case 'organization':
                result = await eraseOrganizationProfile();
                break;
            case 'paymentGateways':
                result = await erasePaymentGateways();
                break;
            case 'sampleData':
                result = await eraseSampleData();
                break;
            default:
                throw new Error("Invalid erase task provided.");
        }
        return { success: true, data: result };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred during erasing.";
        console.error(`Erasing task '${task}' failed:`, error);
        return { success: false, error };
    }
}
