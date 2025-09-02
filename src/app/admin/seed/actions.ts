
'use server';

import { 
    seedInitialUsersAndQuotes, 
    seedCoreTeam, 
    seedOrganizationProfile, 
    seedSampleData,
    type SeedResult
} from "@/services/seed-service";

type SeedTask = 'initial' | 'coreTeam' | 'organization' | 'sampleData';

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
